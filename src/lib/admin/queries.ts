import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { category, itemReport, listingFlag, moderationRecord, user } from "@/db/schema";

export async function getModerationQueue() {
  return db
    .select({
      id: itemReport.id,
      title: itemReport.title,
      reportType: itemReport.reportType,
      status: itemReport.status,
      visibility: itemReport.visibility,
      duplicateOfId: itemReport.duplicateOfId,
      createdAt: itemReport.createdAt,
      categoryName: category.name,
      reporterName: user.name,
      openFlags: sql<number>`count(${listingFlag.id}) filter (where ${listingFlag.status} = 'OPEN')`.mapWith(Number),
      reasons: sql<string[]>`coalesce(array_agg(distinct ${listingFlag.reason}::text) filter (where ${listingFlag.status} = 'OPEN'), '{}')`,
    })
    .from(itemReport)
    .innerJoin(category, eq(itemReport.categoryId, category.id))
    .innerJoin(user, eq(itemReport.userId, user.id))
    .leftJoin(listingFlag, eq(listingFlag.itemReportId, itemReport.id))
    .groupBy(itemReport.id, category.name, user.name)
    .orderBy(
      desc(sql`count(${listingFlag.id}) filter (where ${listingFlag.status} = 'OPEN')`),
      desc(itemReport.createdAt),
    )
    .limit(100);
}

export async function getModerationLog(limit = 30) {
  return db
    .select({
      id: moderationRecord.id,
      action: moderationRecord.action,
      reason: moderationRecord.reason,
      createdAt: moderationRecord.createdAt,
      itemId: itemReport.id,
      itemTitle: itemReport.title,
      moderatorName: user.name,
    })
    .from(moderationRecord)
    .innerJoin(itemReport, eq(moderationRecord.itemReportId, itemReport.id))
    .leftJoin(user, eq(moderationRecord.moderatorId, user.id))
    .orderBy(desc(moderationRecord.createdAt))
    .limit(limit);
}
