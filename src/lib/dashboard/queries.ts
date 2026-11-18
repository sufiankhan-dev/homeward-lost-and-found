import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityEvent, category, claimRequest, itemImage, itemReport } from "@/db/schema";
import type { ItemStatus, ReportType } from "@/lib/constants";

export type MyReport = {
  id: string;
  reportType: ReportType;
  title: string;
  status: ItemStatus;
  visibility: "VISIBLE" | "HIDDEN";
  generalLocation: string;
  eventDate: string;
  createdAt: Date;
  updatedAt: Date;
  categoryName: string;
  categoryIcon: string;
  pendingClaims: number;
  thumbId: string | null;
};

export async function getMyReports(userId: string): Promise<MyReport[]> {
  return db
    .select({
      id: itemReport.id,
      reportType: itemReport.reportType,
      title: itemReport.title,
      status: itemReport.status,
      visibility: itemReport.visibility,
      generalLocation: itemReport.generalLocation,
      eventDate: itemReport.eventDate,
      createdAt: itemReport.createdAt,
      updatedAt: itemReport.updatedAt,
      categoryName: category.name,
      categoryIcon: category.icon,
      pendingClaims: sql<number>`(select count(*) from ${claimRequest} where ${claimRequest.itemReportId} = ${itemReport.id} and ${claimRequest.status} = 'PENDING')`.mapWith(Number),
      thumbId: sql<string | null>`(select ${itemImage.id} from ${itemImage} where ${itemImage.itemReportId} = ${itemReport.id} order by ${itemImage.position} limit 1)`,
    })
    .from(itemReport)
    .innerJoin(category, eq(itemReport.categoryId, category.id))
    .where(eq(itemReport.userId, userId))
    .orderBy(desc(itemReport.updatedAt));
}

export async function getRecentActivity(userId: string, limit = 20) {
  return db
    .select({
      id: activityEvent.id,
      message: activityEvent.message,
      createdAt: activityEvent.createdAt,
      readAt: activityEvent.readAt,
      itemReportId: activityEvent.itemReportId,
      claimRequestId: activityEvent.claimRequestId,
    })
    .from(activityEvent)
    .where(eq(activityEvent.userId, userId))
    .orderBy(desc(activityEvent.createdAt))
    .limit(limit);
}

export async function countUnreadActivity(userId: string) {
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(activityEvent)
    .where(and(eq(activityEvent.userId, userId), sql`${activityEvent.readAt} is null`));
  return row?.n ?? 0;
}

export async function markActivityRead(userId: string) {
  await db
    .update(activityEvent)
    .set({ readAt: new Date() })
    .where(and(eq(activityEvent.userId, userId), sql`${activityEvent.readAt} is null`));
}
