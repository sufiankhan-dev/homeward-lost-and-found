import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { ClaimList } from "@/components/dashboard/claim-list";
import { TabLinks } from "@/components/dashboard/tab-links";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getIncomingClaims, getOutgoingClaims } from "@/lib/claims/queries";
import { firstParam } from "@/lib/search-params";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Requests & messages" };

export default async function RequestsPage(props: PageProps<"/dashboard/requests">) {
  const user = await requireUser("/dashboard/requests");
  const tab = firstParam((await props.searchParams).tab) === "sent" ? "sent" : "received";
  const [incoming, outgoing] = await Promise.all([getIncomingClaims(user.id), getOutgoingClaims(user.id)]);
  const claims = tab === "received" ? incoming : outgoing;
  const waiting = incoming.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Requests &amp; messages</h1>
        <p className="mt-1 text-muted-foreground">
          {waiting > 0
            ? `${waiting} request${waiting > 1 ? "s are" : " is"} waiting for your reply.`
            : "Private conversations about your reports and the items you've asked about."}
        </p>
      </div>
      <TabLinks
        label="Request direction"
        current={tab}
        tabs={[
          { value: "received", label: "About my reports", count: incoming.length, href: "/dashboard/requests" },
          { value: "sent", label: "Sent by me", count: outgoing.length, href: "/dashboard/requests?tab=sent" },
        ]}
      />
      {claims.length ? (
        <ClaimList claims={claims} direction={tab === "received" ? "incoming" : "outgoing"} />
      ) : (
        <EmptyState
          icon={<Inbox />}
          title={tab === "received" ? "No requests yet" : "You haven't sent any requests"}
          description={
            tab === "received"
              ? "When someone thinks they've found your item, or that your found item is theirs, their request appears here."
              : "Found a listing that matches? Open it and send a private request."
          }
        >
          <Button asChild variant="outline">
            <Link href="/browse">Browse items</Link>
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
