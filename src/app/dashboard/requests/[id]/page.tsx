import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { ClaimDecision, MessageComposer, WithdrawButton } from "@/components/claims/claim-controls";
import { ClaimStatusBadge, ReportTypeBadge, StatusBadge } from "@/components/items/badges";
import { PageHeader } from "@/components/page-header";
import { CLAIM_STATUS_INFO } from "@/lib/constants";
import { getClaimThread } from "@/lib/claims/queries";
import { formatRelative } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

export default async function ClaimThreadPage(props: PageProps<"/dashboard/requests/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/dashboard/requests/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const thread = await getClaimThread(id, user);
  if (!thread) notFound();

  const isOwner = thread.viewerRole === "owner";
  const other = isOwner ? thread.requesterName : thread.ownerName;
  const canMessage = thread.status === "ACCEPTED" || (thread.status === "PENDING" && !isOwner);
  const names = (senderId: string) =>
    senderId === user.id ? "You" : senderId === thread.requesterId ? thread.requesterName : thread.ownerName;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        breadcrumbs={[{ href: "/dashboard/requests", label: "Requests" }]}
        title={thread.itemTitle}
        description={isOwner ? `Request from ${thread.requesterName} about your report` : `Your request to ${thread.ownerName}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ClaimStatusBadge status={thread.status} />
        <ReportTypeBadge type={thread.itemType} />
        <StatusBadge status={thread.itemStatus} />
        <Link href={`/items/${thread.itemId}`} className="ml-auto text-sm font-medium text-primary underline-offset-4 hover:underline">
          View listing
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">{CLAIM_STATUS_INFO[thread.status].description}</p>

      <section aria-labelledby="request-heading" className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 id="request-heading" className="font-semibold">
          {isOwner ? `${thread.requesterName}'s request` : "Your request"}{" "}
          <span className="text-sm font-normal text-muted-foreground">· {formatRelative(thread.createdAt)}</span>
        </h2>
        <p className="whitespace-pre-line">{thread.message}</p>
        {thread.verificationAnswer && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-3 text-sm">
              <p className="flex items-center gap-1.5 font-medium">
                <Lock className="size-3.5" aria-hidden /> {isOwner ? "Their identifying detail" : "Your identifying detail"}
              </p>
              <p className="mt-1 text-muted-foreground">{thread.verificationAnswer}</p>
            </div>
            {isOwner && thread.itemVerificationDetails && (
              <div className="rounded-xl border border-dashed p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium">
                  <Lock className="size-3.5" aria-hidden /> Your private note (compare)
                </p>
                <p className="mt-1 text-muted-foreground">{thread.itemVerificationDetails}</p>
              </div>
            )}
          </div>
        )}
        {isOwner && thread.status === "PENDING" && <ClaimDecision claimId={thread.id} requesterName={thread.requesterName} />}
        {!isOwner && (thread.status === "PENDING" || thread.status === "ACCEPTED") && <WithdrawButton claimId={thread.id} />}
      </section>

      <section aria-labelledby="messages-heading" className="space-y-4">
        <h2 id="messages-heading" className="text-lg font-semibold">
          Conversation with {other}
        </h2>
        {thread.messages.length ? (
          <ol className="space-y-3" aria-label="Messages">
            {thread.messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5", mine ? "bg-primary text-primary-foreground" : "border bg-card")}>
                    <p className={cn("text-xs", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {names(m.senderId)} · {formatRelative(m.createdAt)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-line">{m.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {thread.status === "PENDING" && isOwner
              ? "Accept the request to start a private conversation."
              : "No messages yet."}
          </p>
        )}
        {canMessage ? (
          <MessageComposer claimId={thread.id} />
        ) : (
          thread.status !== "PENDING" && (
            <p className="text-sm text-muted-foreground">This conversation is closed.</p>
          )
        )}
      </section>
    </div>
  );
}
