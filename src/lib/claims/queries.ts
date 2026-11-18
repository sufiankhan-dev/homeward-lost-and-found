import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { claimMessage, claimRequest, itemReport, user } from "@/db/schema";

const requester = alias(user, "requester");
const owner = alias(user, "owner");

const firstName = (name: string) => name.split(" ")[0] ?? "Member";

export type ClaimSummary = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  message: string;
  createdAt: Date;
  updatedAt: Date;
  itemId: string;
  itemTitle: string;
  itemType: "LOST" | "FOUND";
  itemStatus: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  otherPartyName: string;
};

/** Requests other people sent about the viewer's reports. */
export async function getIncomingClaims(userId: string): Promise<ClaimSummary[]> {
  const rows = await db
    .select({
      id: claimRequest.id,
      status: claimRequest.status,
      message: claimRequest.message,
      createdAt: claimRequest.createdAt,
      updatedAt: claimRequest.updatedAt,
      itemId: itemReport.id,
      itemTitle: itemReport.title,
      itemType: itemReport.reportType,
      itemStatus: itemReport.status,
      otherPartyName: requester.name,
    })
    .from(claimRequest)
    .innerJoin(itemReport, eq(claimRequest.itemReportId, itemReport.id))
    .innerJoin(requester, eq(claimRequest.requesterId, requester.id))
    .where(eq(itemReport.userId, userId))
    .orderBy(desc(claimRequest.updatedAt));
  return rows.map((r) => ({ ...r, otherPartyName: firstName(r.otherPartyName) }));
}

/** Requests the viewer sent about other people's reports. */
export async function getOutgoingClaims(userId: string): Promise<ClaimSummary[]> {
  const rows = await db
    .select({
      id: claimRequest.id,
      status: claimRequest.status,
      message: claimRequest.message,
      createdAt: claimRequest.createdAt,
      updatedAt: claimRequest.updatedAt,
      itemId: itemReport.id,
      itemTitle: itemReport.title,
      itemType: itemReport.reportType,
      itemStatus: itemReport.status,
      otherPartyName: owner.name,
    })
    .from(claimRequest)
    .innerJoin(itemReport, eq(claimRequest.itemReportId, itemReport.id))
    .innerJoin(owner, eq(itemReport.userId, owner.id))
    .where(eq(claimRequest.requesterId, userId))
    .orderBy(desc(claimRequest.updatedAt));
  return rows.map((r) => ({ ...r, otherPartyName: firstName(r.otherPartyName) }));
}

export async function countPendingIncoming(userId: string): Promise<number> {
  const rows = await db
    .select({ id: claimRequest.id })
    .from(claimRequest)
    .innerJoin(itemReport, eq(claimRequest.itemReportId, itemReport.id))
    .where(and(eq(itemReport.userId, userId), inArray(claimRequest.status, ["PENDING"])));
  return rows.length;
}

/**
 * A claim conversation, visible only to its two participants (or a moderator).
 * Only first names are shared; email addresses are never selected.
 */
export async function getClaimThread(
  claimId: string,
  viewer: { id: string; role: "user" | "admin" },
) {
  const [row] = await db
    .select({
      id: claimRequest.id,
      status: claimRequest.status,
      message: claimRequest.message,
      verificationAnswer: claimRequest.verificationAnswer,
      createdAt: claimRequest.createdAt,
      requesterId: claimRequest.requesterId,
      requesterName: requester.name,
      itemId: itemReport.id,
      itemTitle: itemReport.title,
      itemType: itemReport.reportType,
      itemStatus: itemReport.status,
      itemOwnerId: itemReport.userId,
      itemVerificationDetails: itemReport.verificationDetails,
      ownerName: owner.name,
    })
    .from(claimRequest)
    .innerJoin(itemReport, eq(claimRequest.itemReportId, itemReport.id))
    .innerJoin(requester, eq(claimRequest.requesterId, requester.id))
    .innerJoin(owner, eq(itemReport.userId, owner.id))
    .where(eq(claimRequest.id, claimId))
    .limit(1);
  if (!row) return null;

  const isOwner = viewer.id === row.itemOwnerId;
  const isRequester = viewer.id === row.requesterId;
  if (!isOwner && !isRequester && viewer.role !== "admin") return null;

  const messages = await db
    .select({
      id: claimMessage.id,
      senderId: claimMessage.senderId,
      body: claimMessage.body,
      createdAt: claimMessage.createdAt,
    })
    .from(claimMessage)
    .where(eq(claimMessage.claimRequestId, claimId))
    .orderBy(asc(claimMessage.createdAt));

  return {
    ...row,
    requesterName: firstName(row.requesterName),
    ownerName: firstName(row.ownerName),
    // The finder's private notes are only for the finder.
    itemVerificationDetails: isOwner ? row.itemVerificationDetails : null,
    viewerRole: isOwner ? ("owner" as const) : isRequester ? ("requester" as const) : ("moderator" as const),
    messages,
  };
}
