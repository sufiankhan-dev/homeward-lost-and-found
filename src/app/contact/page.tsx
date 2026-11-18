import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircleQuestion, Building2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Contact the Lost & Found desk" };

export default function ContactPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Contact the Lost & Found desk"
        description="Most questions are answered fastest by the help assistant or the FAQ. For anything else, reach a person here."
      />
      <ul className="space-y-4">
        <li className="flex gap-4 rounded-2xl border bg-card p-5">
          <MessageCircleQuestion className="size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="font-semibold">Quick answers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select <strong>Need help?</strong> at the bottom of any page, or read{" "}
              <Link href="/help" className="text-primary underline underline-offset-4">How it works &amp; FAQ</Link>.
            </p>
          </div>
        </li>
        <li className="flex gap-4 rounded-2xl border bg-card p-5">
          <Building2 className="size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="font-semibold">In person</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Found items can be handed in at your campus Student Services or security desk. When reporting a found item,
              choose <em>Campus Lost &amp; Found desk</em> as the handover option so owners know where to collect it.
            </p>
          </div>
        </li>
        <li className="flex gap-4 rounded-2xl border bg-card p-5">
          <Mail className="size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <h2 className="font-semibold">Email</h2>
            {supportEmail ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Write to{" "}
                <a href={`mailto:${supportEmail}`} className="text-primary underline underline-offset-4">
                  {supportEmail}
                </a>
                . Please don&apos;t send passwords or card numbers by email.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                The support email address hasn&apos;t been set up for this site yet. Please use the help assistant or visit
                the desk in person.
              </p>
            )}
          </div>
        </li>
      </ul>
    </div>
  );
}
