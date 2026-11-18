import "server-only";
import { db } from "@/db";
import { activityEvent } from "@/db/schema";

type DbLike = Pick<typeof db, "insert">;

export async function logActivity(
  entries: {
    userId: string;
    message: string;
    itemReportId?: string | null;
    claimRequestId?: string | null;
  }[],
  tx: DbLike = db,
) {
  if (entries.length === 0) return;
  await tx.insert(activityEvent).values(
    entries.map((e) => ({
      userId: e.userId,
      message: e.message.slice(0, 300),
      itemReportId: e.itemReportId ?? null,
      claimRequestId: e.claimRequestId ?? null,
    })),
  );
}

export const quote = (title: string) => `“${title}”`;
