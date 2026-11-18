import {
  CircleCheck,
  CircleDot,
  Clock,
  HandHelping,
  Archive,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLAIM_STATUS_INFO,
  ITEM_STATUS_INFO,
  type ClaimStatus,
  type ItemStatus,
  type ReportType,
} from "@/lib/constants";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

/**
 * Lost vs Found are distinguished by text, icon AND colour, so the meaning
 * survives for colour-blind users and in greyscale.
 */
export function ReportTypeBadge({
  type,
  className,
}: {
  type: ReportType;
  className?: string;
}) {
  const Icon = type === "LOST" ? Search : HandHelping;
  return (
    <span
      className={cn(
        base,
        type === "LOST"
          ? "border-lost/25 bg-lost-soft text-lost"
          : "border-found/25 bg-found-soft text-found",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {type === "LOST" ? "Lost" : "Found"}
    </span>
  );
}

const STATUS_STYLE: Record<ItemStatus, { className: string; icon: LucideIcon }> = {
  OPEN: { className: "border-primary/25 bg-accent text-accent-foreground", icon: CircleDot },
  PENDING: { className: "border-warning/30 bg-warning-soft text-warning", icon: Clock },
  RESOLVED: { className: "border-success/30 bg-success-soft text-success", icon: CircleCheck },
  CLOSED: { className: "border-border bg-muted text-muted-foreground", icon: Archive },
};

export function StatusBadge({
  status,
  className,
  withDescription = false,
}: {
  status: ItemStatus;
  className?: string;
  withDescription?: boolean;
}) {
  const { className: style, icon: Icon } = STATUS_STYLE[status];
  const info = ITEM_STATUS_INFO[status];
  return (
    <span className={cn(base, style, className)} title={info.description}>
      <Icon className="size-3.5" aria-hidden />
      <span>
        <span className="sr-only">Status: </span>
        {info.label}
      </span>
      {withDescription && <span className="sr-only">. {info.description}</span>}
    </span>
  );
}

const CLAIM_STYLE: Record<ClaimStatus, string> = {
  PENDING: "border-warning/30 bg-warning-soft text-warning",
  ACCEPTED: "border-success/30 bg-success-soft text-success",
  DECLINED: "border-border bg-muted text-muted-foreground",
  WITHDRAWN: "border-border bg-muted text-muted-foreground",
};

export function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={cn(base, CLAIM_STYLE[status])} title={CLAIM_STATUS_INFO[status].description}>
      <span className="sr-only">Request status: </span>
      {CLAIM_STATUS_INFO[status].label}
    </span>
  );
}
