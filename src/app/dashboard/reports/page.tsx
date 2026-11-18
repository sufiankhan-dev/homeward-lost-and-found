import type { Metadata } from "next";
import Link from "next/link";
import { ReportList } from "@/components/dashboard/report-list";
import { TabLinks } from "@/components/dashboard/tab-links";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getMyReports, type MyReport } from "@/lib/dashboard/queries";
import { firstParam } from "@/lib/search-params";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "My reports" };

const TABS = ["all", "lost", "found", "resolved"] as const;
type Tab = (typeof TABS)[number];

const FILTERS: Record<Tab, (r: MyReport) => boolean> = {
  all: () => true,
  lost: (r) => r.reportType === "LOST" && r.status !== "RESOLVED",
  found: (r) => r.reportType === "FOUND" && r.status !== "RESOLVED",
  resolved: (r) => r.status === "RESOLVED",
};
const LABELS: Record<Tab, string> = { all: "All", lost: "Lost items", found: "Found items", resolved: "Reunited" };

export default async function MyReportsPage(props: PageProps<"/dashboard/reports">) {
  const user = await requireUser("/dashboard/reports");
  const raw = firstParam((await props.searchParams).tab);
  const tab: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "all";
  const reports = await getMyReports(user.id);
  const shown = reports.filter(FILTERS[tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My reports</h1>
        <p className="mt-1 text-muted-foreground">Edit, close or mark reports as reunited. Closing can be undone.</p>
      </div>
      <TabLinks
        label="Filter my reports"
        current={tab}
        tabs={TABS.map((t) => ({
          value: t,
          label: LABELS[t],
          count: reports.filter(FILTERS[t]).length,
          href: t === "all" ? "/dashboard/reports" : `/dashboard/reports?tab=${t}`,
        }))}
      />
      {shown.length ? (
        <ReportList reports={shown} />
      ) : (
        <EmptyState
          title={tab === "resolved" ? "Nothing reunited yet" : "No reports here"}
          description={
            tab === "resolved"
              ? "When an item is back with its owner, mark the report as reunited and it will show here."
              : "Reports you submit will appear here so you can manage them."
          }
        >
          <Button asChild>
            <Link href={tab === "found" ? "/report/found" : "/report/lost"}>
              {tab === "found" ? "Report a found item" : "Report a lost item"}
            </Link>
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
