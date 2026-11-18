import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { firstParam } from "@/lib/search-params";
import { getCurrentUser, isSafeRedirect } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const nextParam = firstParam((await props.searchParams).next);
  const next = isSafeRedirect(nextParam) ? nextParam : "/dashboard";
  if (await getCurrentUser()) redirect(next);
  return (
    <AuthShell title="Sign in" description="Sign in to report items, send requests and track replies.">
      <AuthForm mode="sign-in" next={next} />
    </AuthShell>
  );
}
