import Link from "next/link";
import { EyeOff, Inbox, MapPin } from "lucide-react";
import { ReportTypeBadge, StatusBadge } from "@/components/items/badges";
import { ItemThumbnail } from "@/components/items/item-thumbnail";
import { OwnerActions } from "@/components/items/owner-actions";
import type { MyReport } from "@/lib/dashboard/queries";
import { formatDate, formatRelative } from "@/lib/format";

/** The owner's reports, each with its management actions beside it (mapping). */
export function ReportList({ reports, showActions = true }: { reports: MyReport[]; showActions?: boolean }) {
  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row">
          <div className="w-full shrink-0 overflow-hidden rounded-xl sm:w-36">
            <ItemThumbnail
              imageId={report.thumbId ?? undefined}
              alt=""
              categoryIcon={report.categoryIcon}
              categoryName={report.categoryName}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ReportTypeBadge type={report.reportType} />
              <StatusBadge status={report.status} />
              {report.visibility === "HIDDEN" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
                  <EyeOff className="size-3.5" aria-hidden /> Hidden by moderator
                </span>
              )}
            </div>
            <h3 className="font-semibold">
              <Link href={`/items/${report.id}`} className="underline-offset-4 hover:underline">
                {report.title}
              </Link>
            </h3>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {report.generalLocation}
              </span>
              <span>{formatDate(report.eventDate)}</span>
              <span>Updated {formatRelative(report.updatedAt)}</span>
            </p>
            {report.pendingClaims > 0 && (
              <Link
                href="/dashboard/requests"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-warning-soft px-3 text-sm font-medium text-warning"
              >
                <Inbox className="size-4" aria-hidden />
                {report.pendingClaims} request{report.pendingClaims > 1 ? "s" : ""} waiting for your reply
              </Link>
            )}
            {showActions && (
              <div className="pt-2">
                <OwnerActions
                  itemId={report.id}
                  title={report.title}
                  status={report.status}
                  layout="row"
                  afterDeleteHref="/dashboard/reports"
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
