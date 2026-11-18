"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { claimMessage, claimRequest, itemReport } from "@/db/schema";
import {
  failure,
  success,
  validationFailure,
  type ActionResult,
} from "@/lib/action-result";
import { logActivity, quote } from "@/lib/activity";
import { LIMITS, rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import {
  claimDecisionSchema,
  claimMessageSchema,
  claimRequestSchema,
} from "@/lib/validation";

const SIGN_IN_REQUIRED = "Please sign in to continue.";

export async function createClaimRequest(input: {
  itemReportId: string;
  message: string;
  verificationAnswer?: string;
}): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);
  const limited = rateLimit(`claim:${user.id}`, LIMITS.claimRequest);
  if (!limited.ok) {
    return failure("You've sent several requests recently. Please try again later.");
  }

  const parsed = claimRequestSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const { itemReportId, message, verificationAnswer } = parsed.data;

  const [item] = await db
    .select({
      id: itemReport.id,
      userId: itemReport.userId,
      title: itemReport.title,
      status: itemReport.status,
      visibility: itemReport.visibility,
      reportType: itemReport.reportType,
    })
    .from(itemReport)
    .where(eq(itemReport.id, itemReportId))
    .limit(1);

  if (!item || item.visibility === "HIDDEN") return failure("This listing is no longer available.");
  if (item.userId === user.id) return failure("This is your own report.");
  if (item.status === "RESOLVED" || item.status === "CLOSED") {
    return failure("This listing is no longer accepting requests.");
  }
  if (item.reportType === "FOUND" && !verificationAnswer) {
    return {
      ok: false,
      error: "Some details need attention. Check the highlighted fields.",
      fieldErrors: {
        verificationAnswer: [
          "Describe something only the owner would know, so the finder can confirm it's yours.",
        ],
      },
    };
  }

  const [existing] = await db
    .select({ id: claimRequest.id, status: claimRequest.status })
    .from(claimRequest)
    .where(and(eq(claimRequest.itemReportId, item.id), eq(claimRequest.requesterId, user.id)))
    .limit(1);
  if (existing && existing.status !== "WITHDRAWN") {
    return failure("You've already contacted the reporter about this item. Check your dashboard for replies.");
  }

  const id = await db.transaction(async (tx) => {
    let claimId: string;
    if (existing) {
      await tx
        .update(claimRequest)
        .set({ status: "PENDING", message, verificationAnswer: verificationAnswer ?? null })
        .where(eq(claimRequest.id, existing.id));
      claimId = existing.id;
    } else {
      const [row] = await tx
        .insert(claimRequest)
        .values({
          itemReportId: item.id,
          requesterId: user.id,
          message,
          verificationAnswer: verificationAnswer ?? null,
        })
        .returning({ id: claimRequest.id });
      claimId = row.id;
    }
    const verb = item.reportType === "FOUND" ? "claim request" : "message about a possible find";
    await logActivity(
      [
        {
          userId: item.userId,
          itemReportId: item.id,
          claimRequestId: claimId,
          message: `${user.name.split(" ")[0]} sent a ${verb} for ${quote(item.title)}.`,
        },
        {
          userId: user.id,
          itemReportId: item.id,
          claimRequestId: claimId,
          message: `You sent a ${verb} for ${quote(item.title)}.`,
        },
      ],
      tx,
    );
    return claimId;
  });

  revalidatePath("/", "layout");
  return success({ id });
}

async function loadClaim(claimId: string) {
  const [row] = await db
    .select({
      id: claimRequest.id,
      status: claimRequest.status,
      requesterId: claimRequest.requesterId,
      itemId: itemReport.id,
      itemOwnerId: itemReport.userId,
      itemTitle: itemReport.title,
      itemStatus: itemReport.status,
    })
    .from(claimRequest)
    .innerJoin(itemReport, eq(claimRequest.itemReportId, itemReport.id))
    .where(eq(claimRequest.id, claimId))
    .limit(1);
  return row ?? null;
}

export async function respondToClaim(input: {
  claimRequestId: string;
  decision: "ACCEPTED" | "DECLINED";
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);
  const parsed = claimDecisionSchema.safeParse(input);
  if (!parsed.success) return failure("That response isn't valid.");

  const claim = await loadClaim(parsed.data.claimRequestId);
  if (!claim) return failure("This request no longer exists.");
  if (claim.itemOwnerId !== user.id) {
    return failure("Only the person who reported the item can respond.");
  }
  if (claim.status !== "PENDING") return failure("This request has already been answered.");

  const { decision } = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(claimRequest).set({ status: decision }).where(eq(claimRequest.id, claim.id));
    if (decision === "ACCEPTED" && claim.itemStatus === "OPEN") {
      await tx.update(itemReport).set({ status: "PENDING" }).where(eq(itemReport.id, claim.itemId));
    }
    await logActivity(
      [
        {
          userId: claim.requesterId,
          itemReportId: claim.itemId,
          claimRequestId: claim.id,
          message:
            decision === "ACCEPTED"
              ? `Your request for ${quote(claim.itemTitle)} was accepted. Reply in the conversation to arrange a handover.`
              : `Your request for ${quote(claim.itemTitle)} was declined.`,
        },
        {
          userId: user.id,
          itemReportId: claim.itemId,
          claimRequestId: claim.id,
          message: `You ${decision === "ACCEPTED" ? "accepted" : "declined"} a request for ${quote(claim.itemTitle)}.`,
        },
      ],
      tx,
    );
  });

  revalidatePath("/", "layout");
  return success(null);
}

export async function withdrawClaim(claimRequestId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);
  const claim = await loadClaim(claimRequestId);
  if (!claim) return failure("This request no longer exists.");
  if (claim.requesterId !== user.id) return failure("Only the sender can withdraw this request.");
  if (claim.status !== "PENDING" && claim.status !== "ACCEPTED") {
    return failure("This request can no longer be withdrawn.");
  }

  await db.transaction(async (tx) => {
    await tx.update(claimRequest).set({ status: "WITHDRAWN" }).where(eq(claimRequest.id, claim.id));
    if (claim.status === "ACCEPTED" && claim.itemStatus === "PENDING") {
      const others = await tx
        .select({ id: claimRequest.id })
        .from(claimRequest)
        .where(
          and(
            eq(claimRequest.itemReportId, claim.itemId),
            eq(claimRequest.status, "ACCEPTED"),
            ne(claimRequest.id, claim.id),
          ),
        )
        .limit(1);
      if (others.length === 0) {
        await tx.update(itemReport).set({ status: "OPEN" }).where(eq(itemReport.id, claim.itemId));
      }
    }
    await logActivity(
      [
        {
          userId: claim.itemOwnerId,
          itemReportId: claim.itemId,
          message: `A request for ${quote(claim.itemTitle)} was withdrawn.`,
        },
      ],
      tx,
    );
  });

  revalidatePath("/", "layout");
  return success(null);
}

export async function sendClaimMessage(input: {
  claimRequestId: string;
  body: string;
}): Promise<ActionResult<{ id: string; createdAt: string }>> {
  const user = await getCurrentUser();
  if (!user) return failure(SIGN_IN_REQUIRED);
  if (!rateLimit(`msg:${user.id}`, LIMITS.claimMessage).ok) {
    return failure("You're sending messages very quickly. Please wait a moment.");
  }
  const parsed = claimMessageSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const claim = await loadClaim(parsed.data.claimRequestId);
  if (!claim) return failure("This conversation no longer exists.");
  const isParticipant = user.id === claim.requesterId || user.id === claim.itemOwnerId;
  if (!isParticipant) return failure("You're not part of this conversation.");
  if (claim.status === "DECLINED" || claim.status === "WITHDRAWN") {
    return failure("This conversation is closed.");
  }

  const [row] = await db
    .insert(claimMessage)
    .values({ claimRequestId: claim.id, senderId: user.id, body: parsed.data.body })
    .returning({ id: claimMessage.id, createdAt: claimMessage.createdAt });

  const recipient = user.id === claim.requesterId ? claim.itemOwnerId : claim.requesterId;
  await logActivity([
    {
      userId: recipient,
      itemReportId: claim.itemId,
      claimRequestId: claim.id,
      message: `New message from ${user.name.split(" ")[0]} about ${quote(claim.itemTitle)}.`,
    },
  ]);

  revalidatePath(`/dashboard/requests/${claim.id}`);
  return success({ id: row.id, createdAt: row.createdAt.toISOString() });
}
