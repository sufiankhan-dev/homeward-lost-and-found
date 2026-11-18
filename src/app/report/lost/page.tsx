import type { Metadata } from "next";
import { ReportPage } from "../report-page";

export const metadata: Metadata = { title: "Report a lost item" };
export const dynamic = "force-dynamic";

export default function ReportLostPage() {
  return <ReportPage reportType="LOST" />;
}
