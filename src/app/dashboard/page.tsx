import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, HandHelping, Inbox, Search, ShieldAlert } from "lucide-react";
import { ClaimList } from "@/components/dashboard/claim-list";
import { ReportList } from "@/components/dashboard/report-list";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getIncomingClaims, getOutgoingClaims } from "@/lib/claims/queries";
import { getMyReports, getRecentActivity } from "@/lib/dashboard/queries";
import { formatRelative } from "@/lib/format";
import { firstParam } from "@/lib/search-params";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const denied = firstParam((await props.searchParams).denied);
  const [reports, incoming, outgoing, activity] = await Promise.all([
    getMyReports(user.id),
    getIncomingClaims(user.id),
    getOutgoingClaims(user.id),
    getRecentActivity(user.id, 6),
  ]);

  const active = (r: (typeof reports)[number]) => r.status === "OPEN" || r.status === "PENDING";
  const stats = [
    { label: "Open lost reports", value: reports.filter((r) => r.reportType === "LOST" && active(r)).length, icon: Search, href: "/dashboard/reports?tab=lost" },
    { label: "Open found reports", value: reports.filter((r) => r.reportType === "FOUND" && active(r)).length, icon: HandHelping, href: "/dashboard/reports?tab=found" },
    { label: "Requests to answer", value: incoming.filter((c) => c.status === "PENDING").length, icon: Inbox, href: "/dashboard/requests" },
    { label: "Reunited", value: reports.filter((r) => r.status === "RESOLVED").length, icon: CircleCheck, href: "/dashboard/reports?tab=resolved" },
  ];
  const needsReply = incoming.filter((c) => c.status === "PENDING");
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-10">
      {denied === "admin" && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm">
          <ShieldAlert className="size-4" aria-hidden /> The moderation area is only available to moderators.
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back, {firstName}</h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s what&apos;s happening with your reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-lost hover:bg-lost/90">
            <Link href="/report/lost">
              <Search aria-hidden /> Report lost
            </Link>
          </Button>
          <Button asChild className="bg-found hover:bg-found/90">
            <Link href="/report/found">
              <HandHelping aria-hidden /> Report found
            </Link>
          </Button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className="flex h-full flex-col gap-2 rounded-2xl border bg-card p-4 transition hover:border-primary/40">
              <stat.icon className="size-5 text-primary" aria-hidden />
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {needsReply.length > 0 && (
        <section aria-labelledby="attention-heading" className="space-y-3">
          <h2 id="attention-heading" className="text-lg font-semibold">
            Needs your reply
          </h2>
          <ClaimList claims={needsReply.slice(0, 3)} direction="incoming" />
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="recent-reports-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="recent-reports-heading" className="text-lg font-semibold">
              Your recent reports
            </h2>
            {reports.length > 3 && (
              <Link href="/dashboard/reports" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                See all {reports.length}
              </Link>
            )}
          </div>
          {reports.length ? (
            <ReportList reports={reports.slice(0, 3)} showActions={false} />
          ) : (
            <EmptyState title="You haven't reported anything yet" description="Lost something, or found something that isn't yours? It takes about two minutes.">
              <Button asChild>
                <Link href="/report/lost">Report a lost item</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/report/found">Report a found item</Link>
              </Button>
            </EmptyState>
          )}
          {outgoing.length > 0 && (
            <p className="text-sm text-muted-foreground">
              You&apos;ve sent {outgoing.length} request{outgoing.length > 1 ? "s" : ""} about other people&apos;s items.{" "}
              <Link href="/dashboard/requests?tab=sent" className="font-medium text-primary underline underline-offset-4">
                View sent requests
              </Link>
            </p>
          )}
        </section>

        <section aria-labelledby="activity-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="activity-heading" className="text-lg font-semibold">
              Recent activity
            </h2>
            <Link href="/dashboard/activity" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              All activity
            </Link>
          </div>
          {activity.length ? (
            <ol className="space-y-3 rounded-2xl border bg-card p-4">
              {activity.map((event) => (
                <li key={event.id} className="text-sm">
                  <p>
                    {!event.readAt && <span className="mr-1.5 inline-block size-2 rounded-full bg-primary" aria-label="New" />}
                    {event.message}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatRelative(event.createdAt)}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              Updates about your reports and requests will appear here.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
