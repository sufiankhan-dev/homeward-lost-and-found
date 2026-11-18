import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ReportForm } from "@/components/report/report-form";
import type { ReportType } from "@/lib/constants";
import { getCategories } from "@/lib/items/queries";
import { requireUser } from "@/lib/session";

/** Shared server wrapper for the lost and found report flows. */
export async function ReportPage({ reportType }: { reportType: ReportType }) {
  const isLost = reportType === "LOST";
  await requireUser(isLost ? "/report/lost" : "/report/found");
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumbs={[{ href: "/", label: "Home" }]}
        title={isLost ? "Report a lost item" : "Report a found item"}
        description={
          isLost
            ? "Four short steps, about two minutes. Your draft is saved on this device as you type."
            : "Thank you for helping! Four short steps. Keep one identifying detail private so you can verify the owner."
        }
      />
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        {isLost ? "Found something instead? " : "Lost something instead? "}
        <Link href={isLost ? "/report/found" : "/report/lost"} className="font-medium text-primary underline underline-offset-4">
          {isLost ? "Report a found item" : "Report a lost item"}
        </Link>
      </p>
      <ReportForm mode="create" reportType={reportType} categories={categories} />
    </div>
  );
}
