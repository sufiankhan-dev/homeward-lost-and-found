import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { getRecentActivity, markActivityRead } from "@/lib/dashboard/queries";
import { formatRelative } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await requireUser("/dashboard/activity");
  const events = await getRecentActivity(user.id, 100);
  // Viewing the list marks updates as seen; the "New" markers reflect the state before this visit.
  await markActivityRead(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="mt-1 text-muted-foreground">Every update about your reports and requests, newest first.</p>
      </div>
      {events.length ? (
        <ol className="divide-y rounded-2xl border bg-card">
          {events.map((event) => {
            const href = event.claimRequestId
              ? `/dashboard/requests/${event.claimRequestId}`
              : event.itemReportId
                ? `/items/${event.itemReportId}`
                : null;
            return (
              <li key={event.id} className="flex gap-3 p-4">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${event.readAt ? "bg-transparent" : "bg-primary"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {!event.readAt && <span className="sr-only">New: </span>}
                    {event.message}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelative(event.createdAt)}
                    {href && (
                      <>
                        <span aria-hidden> · </span>
                        <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
                          Open
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState
          icon={<Activity />}
          title="No activity yet"
          description="When you report an item or someone contacts you, it shows up here."
        />
      )}
    </div>
  );
}
