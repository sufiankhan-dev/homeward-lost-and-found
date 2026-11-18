import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Flag, ShieldCheck } from "lucide-react";
import { ModerateDialog } from "@/components/admin/moderate-dialog";
import { ReportTypeBadge, StatusBadge } from "@/components/items/badges";
import { EmptyState, PageHeader } from "@/components/page-header";
import { getModerationLog, getModerationQueue } from "@/lib/admin/queries";
import { FLAG_REASON_LABEL, MODERATION_ACTION_LABEL, type FlagReason } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Moderation" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [queue, log] = await Promise.all([getModerationQueue(), getModerationLog()]);
  const flagged = queue.filter((i) => i.openFlags > 0);
  const others = queue.filter((i) => i.openFlags === 0);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <PageHeader
        title="Moderation"
        description="Review flagged listings first. Every action is recorded and the reporter is told why."
      />

      <section aria-labelledby="flagged-heading" className="space-y-3">
        <h2 id="flagged-heading" className="flex items-center gap-2 text-lg font-semibold">
          <Flag className="size-5 text-destructive" aria-hidden /> Flagged listings ({flagged.length})
        </h2>
        {flagged.length ? (
          <ModerationTable rows={flagged} />
        ) : (
          <EmptyState icon={<ShieldCheck />} title="Nothing to review" description="No listings have open flags right now." />
        )}
      </section>

      <section aria-labelledby="all-heading" className="space-y-3">
        <h2 id="all-heading" className="text-lg font-semibold">
          Recent listings
        </h2>
        <ModerationTable rows={others.slice(0, 30)} />
      </section>

      <section aria-labelledby="log-heading" className="space-y-3">
        <h2 id="log-heading" className="text-lg font-semibold">
          Moderation log
        </h2>
        {log.length ? (
          <ol className="divide-y rounded-2xl border bg-card">
            {log.map((entry) => (
              <li key={entry.id} className="p-4 text-sm">
                <p>
                  <strong>{MODERATION_ACTION_LABEL[entry.action]}</strong> ·{" "}
                  <Link href={`/items/${entry.itemId}`} className="text-primary underline-offset-4 hover:underline">
                    {entry.itemTitle}
                  </Link>
                </p>
                <p className="mt-1 text-muted-foreground">
                  “{entry.reason}” — {entry.moderatorName ?? "Former moderator"}, {formatRelative(entry.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No moderation actions yet.</p>
        )}
      </section>
    </div>
  );
}

type Row = Awaited<ReturnType<typeof getModerationQueue>>[number];

function ModerationTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">Listings with moderation actions</caption>
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            <th scope="col" className="p-3 font-semibold">Listing</th>
            <th scope="col" className="p-3 font-semibold">Status</th>
            <th scope="col" className="p-3 font-semibold">Flags</th>
            <th scope="col" className="p-3 font-semibold">Reported</th>
            <th scope="col" className="p-3 font-semibold"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <ReportTypeBadge type={row.reportType} />
                  <Link href={`/items/${row.id}`} className="font-medium underline-offset-4 hover:underline">
                    {row.title}
                  </Link>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.categoryName} · by {row.reporterName}
                </p>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge status={row.status} />
                  {row.visibility === "HIDDEN" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                      <EyeOff className="size-3.5" aria-hidden /> Hidden
                    </span>
                  )}
                  {row.duplicateOfId && <span className="text-xs text-muted-foreground">Duplicate</span>}
                </div>
              </td>
              <td className="p-3">
                {row.openFlags > 0 ? (
                  <>
                    <span className="font-semibold text-destructive">{row.openFlags}</span>
                    <p className="text-xs text-muted-foreground">
                      {row.reasons.map((r) => FLAG_REASON_LABEL[r as FlagReason] ?? r).join(", ")}
                    </p>
                  </>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </td>
              <td className="p-3 text-muted-foreground">{formatRelative(row.createdAt)}</td>
              <td className="p-3 text-right">
                <ModerateDialog itemId={row.id} title={row.title} hidden={row.visibility === "HIDDEN"} hasFlags={row.openFlags > 0} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
