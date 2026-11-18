import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import {
  category,
  claimRequest,
  itemImage,
  itemReport,
  listingFlag,
  user,
} from "@/db/schema";
import { PAGE_SIZE, type ItemStatus } from "@/lib/constants";
import type { SearchFilters } from "@/lib/validation";

/**
 * Columns that are safe to show publicly. `verificationDetails` and the
 * reporter's email are deliberately excluded.
 */
const publicColumns = {
  id: itemReport.id,
  reportType: itemReport.reportType,
  title: itemReport.title,
  description: itemReport.description,
  generalLocation: itemReport.generalLocation,
  eventDate: itemReport.eventDate,
  distinguishingFeatures: itemReport.distinguishingFeatures,
  contactPreference: itemReport.contactPreference,
  status: itemReport.status,
  visibility: itemReport.visibility,
  duplicateOfId: itemReport.duplicateOfId,
  createdAt: itemReport.createdAt,
  updatedAt: itemReport.updatedAt,
  userId: itemReport.userId,
  categoryName: category.name,
  categorySlug: category.slug,
  categoryIcon: category.icon,
};

export type ItemImageInfo = {
  id: string;
  width: number;
  height: number;
  altText: string | null;
};

export type PublicItem = {
  id: string;
  reportType: "LOST" | "FOUND";
  title: string;
  description: string;
  generalLocation: string;
  eventDate: string;
  distinguishingFeatures: string | null;
  contactPreference: "IN_APP" | "DESK";
  status: ItemStatus;
  visibility: "VISIBLE" | "HIDDEN";
  duplicateOfId: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string;
  images: ItemImageInfo[];
};

async function attachImages<T extends { id: string }>(
  rows: T[],
): Promise<(T & { images: ItemImageInfo[] })[]> {
  if (rows.length === 0) return [];
  const images = await db
    .select({
      id: itemImage.id,
      itemReportId: itemImage.itemReportId,
      width: itemImage.width,
      height: itemImage.height,
      altText: itemImage.altText,
    })
    .from(itemImage)
    .where(
      inArray(
        itemImage.itemReportId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(itemImage.position), asc(itemImage.createdAt));
  return rows.map((row) => ({
    ...row,
    images: images
      .filter((img) => img.itemReportId === row.id)
      .map(({ id, width, height, altText }) => ({ id, width, height, altText })),
  }));
}

const publiclyListed = and(
  eq(itemReport.visibility, "VISIBLE"),
  isNull(itemReport.duplicateOfId),
);

const searchVector = sql`to_tsvector('english', ${itemReport.title} || ' ' || ${itemReport.description} || ' ' || coalesce(${itemReport.distinguishingFeatures}, ''))`;

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export type SearchResult = {
  items: PublicItem[];
  total: number;
  page: number;
  pageCount: number;
};

export async function searchItems(filters: SearchFilters): Promise<SearchResult> {
  const page = filters.page ?? 1;
  const conditions: SQL[] = [publiclyListed!];

  const status = filters.status ?? "active";
  if (status === "active") {
    conditions.push(inArray(itemReport.status, ["OPEN", "PENDING"]));
  } else if (status !== "all") {
    conditions.push(eq(itemReport.status, status));
  }
  if (filters.type) conditions.push(eq(itemReport.reportType, filters.type));
  if (filters.category) conditions.push(eq(category.slug, filters.category));
  if (filters.location) {
    conditions.push(
      ilike(itemReport.generalLocation, `%${escapeLike(filters.location)}%`),
    );
  }
  if (filters.from) conditions.push(gte(itemReport.eventDate, filters.from));
  if (filters.to) conditions.push(lte(itemReport.eventDate, filters.to));

  let rank: SQL | undefined;
  if (filters.q) {
    const tsQuery = sql`websearch_to_tsquery('english', ${filters.q})`;
    const like = `%${escapeLike(filters.q)}%`;
    // Full-text match, plus substring matching so partial words still work.
    conditions.push(
      or(
        sql`${searchVector} @@ ${tsQuery}`,
        ilike(itemReport.title, like),
        ilike(itemReport.description, like),
        ilike(category.name, like),
      )!,
    );
    rank = sql`ts_rank(${searchVector}, ${tsQuery}) + (case when ${itemReport.title} ilike ${like} then 1 else 0 end)`;
  }

  const where = and(...conditions);
  const sort = filters.sort ?? (filters.q ? "relevance" : "newest");
  const orderBy =
    sort === "oldest"
      ? [asc(itemReport.createdAt)]
      : sort === "relevance" && rank
        ? [desc(rank), desc(itemReport.createdAt)]
        : [desc(itemReport.createdAt)];

  const [{ total }] = await db
    .select({ total: count() })
    .from(itemReport)
    .innerJoin(category, eq(itemReport.categoryId, category.id))
    .where(where);

  const rows = await db
    .select(publicColumns)
    .from(itemReport)
    .innerJoin(category, eq(itemReport.categoryId, category.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return {
    items: await attachImages(rows),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getRecentItems(limit = 6): Promise<PublicItem[]> {
  const rows = await db
    .select(publicColumns)
    .from(itemReport)
    .innerJoin(category, eq(itemReport.categoryId, category.id))
    .where(and(publiclyListed, inArray(itemReport.status, ["OPEN", "PENDING"])))
    .orderBy(desc(itemReport.createdAt))
    .limit(limit);
  return attachImages(rows);
}

export async function getCategories() {
  return db.select().from(category).orderBy(asc(category.sortOrder));
}

export async function getCategoriesWithCounts() {
  return db
    .select({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      openCount: sql<number>`count(${itemReport.id}) filter (where ${itemReport.status} in ('OPEN','PENDING') and ${itemReport.visibility} = 'VISIBLE' and ${itemReport.duplicateOfId} is null)`.mapWith(Number),
    })
    .from(category)
    .leftJoin(itemReport, eq(itemReport.categoryId, category.id))
    .groupBy(category.id)
    .orderBy(asc(category.sortOrder));
}

export type ItemDetail = PublicItem & {
  reporterFirstName: string;
  /** Only populated for the owner (or a moderator). */
  verificationDetails: string | null;
};

/**
 * Loads a listing for display. Hidden listings are only returned to their
 * owner or a moderator. Private verification details are only included for
 * the owner/moderator.
 */
export async function getItemForViewer(
  id: string,
  viewer: { id: string; role: "user" | "admin" } | null,
): Promise<ItemDetail | null> {
  const [row] = await db
    .select({
      ...publicColumns,
      reporterName: user.name,
      verificationDetails: itemReport.verificationDetails,
    })
    .from(itemReport)
    .innerJoin(category, eq(itemReport.categoryId, category.id))
    .innerJoin(user, eq(itemReport.userId, user.id))
    .where(eq(itemReport.id, id))
    .limit(1);
  if (!row) return null;

  const isOwner = viewer?.id === row.userId;
  const isAdmin = viewer?.role === "admin";
  if (row.visibility === "HIDDEN" && !isOwner && !isAdmin) return null;

  const { reporterName, verificationDetails, ...rest } = row;
  const [withImages] = await attachImages([rest]);
  return {
    ...withImages,
    reporterFirstName: reporterName.split(" ")[0] ?? "A member",
    verificationDetails: isOwner || isAdmin ? verificationDetails : null,
  };
}

/** Full editable record for the owner. Returns null if not owner/admin. */
export async function getItemForEdit(
  id: string,
  viewer: { id: string; role: "user" | "admin" },
) {
  const row = await db.query.itemReport.findFirst({
    where: eq(itemReport.id, id),
    with: { images: { orderBy: [asc(itemImage.position)] } },
  });
  if (!row) return null;
  if (row.userId !== viewer.id && viewer.role !== "admin") return null;
  return row;
}

export async function getViewerClaimForItem(itemId: string, userId: string) {
  const [row] = await db
    .select({ id: claimRequest.id, status: claimRequest.status })
    .from(claimRequest)
    .where(
      and(eq(claimRequest.itemReportId, itemId), eq(claimRequest.requesterId, userId)),
    )
    .limit(1);
  return row ?? null;
}

export async function hasViewerFlagged(itemId: string, userId: string) {
  const [row] = await db
    .select({ id: listingFlag.id })
    .from(listingFlag)
    .where(and(eq(listingFlag.itemReportId, itemId), eq(listingFlag.reporterId, userId)))
    .limit(1);
  return !!row;
}
