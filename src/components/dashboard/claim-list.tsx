import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ClaimStatusBadge, ReportTypeBadge } from "@/components/items/badges";
import type { ClaimSummary } from "@/lib/claims/queries";
import { formatRelative } from "@/lib/format";

export function ClaimList({ claims, direction }: { claims: ClaimSummary[]; direction: "incoming" | "outgoing" }) {
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {claims.map((claim) => (
        <li key={claim.id}>
          <Link
            href={`/dashboard/requests/${claim.id}`}
            className="flex min-h-16 items-center gap-4 p-4 transition hover:bg-muted/60"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <ClaimStatusBadge status={claim.status} />
                <ReportTypeBadge type={claim.itemType} />
              </div>
              <p className="font-semibold">{claim.itemTitle}</p>
              <p className="truncate text-sm text-muted-foreground">
                {direction === "incoming" ? `From ${claim.otherPartyName}: ` : `To ${claim.otherPartyName}: `}
                {claim.message}
              </p>
              <p className="text-xs text-muted-foreground">Updated {formatRelative(claim.updatedAt)}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="sr-only">Open conversation</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
