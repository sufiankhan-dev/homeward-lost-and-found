import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { firstParam } from "@/lib/search-params";
import { getCurrentUser, isSafeRedirect } from "@/lib/session";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const nextParam = firstParam((await props.searchParams).next);
  const next = isSafeRedirect(nextParam) ? nextParam : "/dashboard";
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell
      title="Create your free account"
      description="An account keeps contact private and lets you track your reports. Browsing never needs one."
    >
      <AuthForm mode="sign-up" next={next} />
    </AuthShell>
  );
}
