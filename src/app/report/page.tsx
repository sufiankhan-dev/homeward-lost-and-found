import { redirect } from "next/navigation";

// The two report flows are separate pages; /report simply points to the home choice.
export default function ReportIndex() {
  redirect("/#main");
}
