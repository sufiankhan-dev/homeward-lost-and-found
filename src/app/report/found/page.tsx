import type { Metadata } from "next";
import { ReportPage } from "../report-page";

export const metadata: Metadata = { title: "Report a found item" };
export const dynamic = "force-dynamic";

export default function ReportFoundPage() {
  return <ReportPage reportType="FOUND" />;
}
