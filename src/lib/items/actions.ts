"use server";

import { and, eq, inArray, isNull, notInArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { claimRequest, itemImage, itemReport, listingFlag } from "@/db/schema";
import {
  failure,
  success,
  validationFailure,
  type ActionResult,
} from "@/lib/action-result";
import { logActivity, quote } from "@/lib/activity";
import { ITEM_STATUS_INFO, type ItemStatus } from "@/lib/constants";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { deleteObject } from "@/lib/storage";
import {
  flagSchema,
  reportFormSchema,
  statusChangeSchema,
  type ReportFormInput,
} from "@/lib/validation";

const SIGN_IN_REQUIRED = "Please sign in to continue.";

async function loadOwnedItem(itemId: string, user: { id: string; role: string }) {
  const [item] = await db
    .select({
      id: itemReport.id,
      userId: itemReport.userId,
      title: itemReport.title,
      status: itemReport.status,
      reportType: itemReport.reportType,
    })
    .from(itemReport)
    .where(eq(itemReport.id, itemId))
    .limit(1);
  if (!item) return { ok: false as const, error: "This report no longer exists." };
  if (item.userId !== user.id && user.role !== "admin") {
    return { ok: false as const, error: "You can only change reports that you created." };
  }
  return { ok: true as const, item };
}

export async function createReport(
  input: ReportFormInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);

  const limited = rateLimit(`report:${user.id}`, LIMITS.createReport);
  if (!limited.ok) {
    return failure(
      `You've submitted several reports recently. Please try again in ${Math.ceil(limited.retryAfterSeconds / 60)} minutes.`,
    );
  }

  const parsed = reportFormSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const values = parsed.data;

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(itemReport)
      .values({
        userId: user.id,
        reportType: values.reportType,
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        generalLocation: values.generalLocation,
        eventDate: values.eventDate,
        distinguishingFeatures: values.distinguishingFeatures ?? null,
        verificationDetails:
          values.reportType === "FOUND" ? (values.verificationDetails ?? null) : null,
        contactPreference: values.contactPreference,
      })
      .returning({ id: itemReport.id });

    if (values.imageIds.length > 0) {
      // Only attach uploads that belong to this user and are not yet used.
      const owned = await tx
        .select({ id: itemImage.id })
        .from(itemImage)
        .where(
          and(
            inArray(itemImage.id, values.imageIds),
            eq(itemImage.uploaderId, user.id),
            isNull(itemImage.itemReportId),
          ),
        );
      for (const img of owned) {
        await tx
          .update(itemImage)
          .set({
            itemReportId: row.id,
            position: values.imageIds.indexOf(img.id),
            altText: `Photo of ${values.title}`.slice(0, 200),
          })
          .where(eq(itemImage.id, img.id));
      }
    }

    await logActivity(
      [
        {
          userId: user.id,
          itemReportId: row.id,
          message: `You reported a ${values.reportType === "LOST" ? "lost" : "found"} item: ${quote(values.title)}.`,
        },
      ],
      tx,
    );
    return row.id;
  });

  revalidatePath("/", "layout");
  return success({ id });
}

export async function updateReport(
  itemId: string,
  input: ReportFormInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);

  const owned = await loadOwnedItem(itemId, user);
  if (!owned.ok) return failure(owned.error);

  const parsed = reportFormSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const values = parsed.data;
  if (values.reportType !== owned.item.reportType) {
    return failure("A report can't be switched between Lost and Found. Create a new report instead.");
  }

  const removedKeys = await db.transaction(async (tx) => {
    await tx
      .update(itemReport)
      .set({
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        generalLocation: values.generalLocation,
        eventDate: values.eventDate,
        distinguishingFeatures: values.distinguishingFeatures ?? null,
        verificationDetails:
          values.reportType === "FOUND" ? (values.verificationDetails ?? null) : null,
        contactPreference: values.contactPreference,
      })
      .where(eq(itemReport.id, itemId));

    // Remove photos the user took off the report.
    const removed = await tx
      .delete(itemImage)
      .where(
        and(
          eq(itemImage.itemReportId, itemId),
          values.imageIds.length > 0
            ? notInArray(itemImage.id, values.imageIds)
            : undefined,
        ),
      )
      .returning({ storageKey: itemImage.storageKey, thumbKey: itemImage.thumbKey });

    if (values.imageIds.length > 0) {
      const usable = await tx
        .select({ id: itemImage.id })
        .from(itemImage)
        .where(
          and(
            inArray(itemImage.id, values.imageIds),
            eq(itemImage.uploaderId, owned.item.userId),
            or(isNull(itemImage.itemReportId), eq(itemImage.itemReportId, itemId)),
          ),
        );
      for (const img of usable) {
        await tx
          .update(itemImage)
          .set({
            itemReportId: itemId,
            position: values.imageIds.indexOf(img.id),
            altText: `Photo of ${values.title}`.slice(0, 200),
          })
          .where(eq(itemImage.id, img.id));
      }
    }

    await logActivity(
      [{ userId: owned.item.userId, itemReportId: itemId, message: `You updated ${quote(values.title)}.` }],
      tx,
    );
    return removed;
  });

  await Promise.all(
    removedKeys.flatMap((k) => [deleteObject(k.storageKey), deleteObject(k.thumbKey)]),
  );

  revalidatePath("/", "layout");
  return success({ id: itemId });
}

/**
 * Change a report's status (close, reopen, mark reunited). Returns the
 * previous status so the UI can offer an Undo action.
 */
export async function changeReportStatus(input: {
  itemReportId: string;
  status: ItemStatus;
}): Promise<ActionResult<{ previousStatus: ItemStatus }>> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);

  const parsed = statusChangeSchema.safeParse(input);
  if (!parsed.success) return failure("That status change isn't valid.");

  const owned = await loadOwnedItem(parsed.data.itemReportId, user);
  if (!owned.ok) return failure(owned.error);
  const { item } = owned;
  const next = parsed.data.status;
  if (item.status === next) return success({ previousStatus: item.status });

  await db.transaction(async (tx) => {
    await tx
      .update(itemReport)
      .set({ status: next, resolvedAt: next === "RESOLVED" ? new Date() : null })
      .where(eq(itemReport.id, item.id));

    await logActivity(
      [
        {
          userId: item.userId,
          itemReportId: item.id,
          message: `${quote(item.title)} is now “${ITEM_STATUS_INFO[next].label}”.`,
        },
      ],
      tx,
    );
  });

  revalidatePath("/", "layout");
  return success({ previousStatus: item.status });
}

export async function deleteReport(itemId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);
  const owned = await loadOwnedItem(itemId, user);
  if (!owned.ok) return failure(owned.error);

  const images = await db
    .select({ storageKey: itemImage.storageKey, thumbKey: itemImage.thumbKey })
    .from(itemImage)
    .where(eq(itemImage.itemReportId, itemId));

  // Notify anyone with an open claim before the cascade removes it.
  const claimants = await db
    .select({ requesterId: claimRequest.requesterId })
    .from(claimRequest)
    .where(and(eq(claimRequest.itemReportId, itemId), eq(claimRequest.status, "PENDING")));

  await db.delete(itemReport).where(eq(itemReport.id, itemId));
  await logActivity([
    { userId: owned.item.userId, message: `You deleted ${quote(owned.item.title)}.` },
    ...claimants.map((c) => ({
      userId: c.requesterId,
      message: `The listing ${quote(owned.item.title)} was removed by its reporter.`,
    })),
  ]);
  await Promise.all(
    images.flatMap((k) => [deleteObject(k.storageKey), deleteObject(k.thumbKey)]),
  );

  revalidatePath("/", "layout");
  return success(null);
}

export async function flagListing(input: {
  itemReportId: string;
  reason: string;
  details?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);
  if (!rateLimit(`flag:${user.id}`, LIMITS.flag).ok) {
    return failure("You've sent several reports recently. Please try again later.");
  }
  const parsed = flagSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const [item] = await db
    .select({ userId: itemReport.userId })
    .from(itemReport)
    .where(eq(itemReport.id, parsed.data.itemReportId))
    .limit(1);
  if (!item) return failure("This listing no longer exists.");
  if (item.userId === user.id) return failure("You can't report your own listing.");

  await db
    .insert(listingFlag)
    .values({
      itemReportId: parsed.data.itemReportId,
      reporterId: user.id,
      reason: parsed.data.reason,
      details: parsed.data.details ?? null,
    })
    .onConflictDoNothing();

  return success(null);
}
