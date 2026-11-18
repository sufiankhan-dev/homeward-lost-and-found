"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { itemReport, listingFlag, moderationRecord } from "@/db/schema";
import { failure, success, validationFailure, type ActionResult } from "@/lib/action-result";
import { logActivity, quote } from "@/lib/activity";
import { MODERATION_ACTION_LABEL, type ModerationAction } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { moderationSchema } from "@/lib/validation";

/**
 * Moderator actions. Authorization is checked here on the server; hiding the
 * admin UI from regular users is only a convenience.
 */
export async function moderateListing(input: {
  itemReportId: string;
  action: ModerationAction;
  reason: string;
  duplicateOfId?: string;
}): Promise<ActionResult> {
  const moderator = await getCurrentUser();
  if (!moderator || moderator.role !== "admin") {
    return failure("Only moderators can do this.");
  }
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { itemReportId, action, reason, duplicateOfId } = parsed.data;

  const [item] = await db
    .select({ id: itemReport.id, userId: itemReport.userId, title: itemReport.title })
    .from(itemReport)
    .where(eq(itemReport.id, itemReportId))
    .limit(1);
  if (!item) return failure("This listing no longer exists.");

  if (action === "MARK_DUPLICATE") {
    if (!duplicateOfId || duplicateOfId === itemReportId) {
      return failure("Choose the original listing this one duplicates.");
    }
    const [original] = await db
      .select({ id: itemReport.id })
      .from(itemReport)
      .where(eq(itemReport.id, duplicateOfId))
      .limit(1);
    if (!original) return failure("The original listing could not be found.");
  }

  await db.transaction(async (tx) => {
    if (action === "HIDE") {
      await tx.update(itemReport).set({ visibility: "HIDDEN" }).where(eq(itemReport.id, item.id));
    } else if (action === "RESTORE") {
      await tx
        .update(itemReport)
        .set({ visibility: "VISIBLE", duplicateOfId: null })
        .where(eq(itemReport.id, item.id));
    } else if (action === "MARK_DUPLICATE") {
      await tx
        .update(itemReport)
        .set({ duplicateOfId: duplicateOfId!, status: "CLOSED" })
        .where(eq(itemReport.id, item.id));
    } else if (action === "CLOSE") {
      await tx.update(itemReport).set({ status: "CLOSED" }).where(eq(itemReport.id, item.id));
    }

    await tx
      .update(listingFlag)
      .set({ status: action === "DISMISS_FLAGS" || action === "RESTORE" ? "DISMISSED" : "RESOLVED" })
      .where(and(eq(listingFlag.itemReportId, item.id), eq(listingFlag.status, "OPEN")));

    await tx.insert(moderationRecord).values({
      itemReportId: item.id,
      moderatorId: moderator.id,
      action,
      reason,
    });

    if (action !== "DISMISS_FLAGS") {
      await logActivity(
        [
          {
            userId: item.userId,
            itemReportId: item.id,
            message: `A moderator updated ${quote(item.title)}: ${MODERATION_ACTION_LABEL[action]}. Reason: ${reason}`,
          },
        ],
        tx,
      );
    }
  });

  revalidatePath("/", "layout");
  return success(null);
}
