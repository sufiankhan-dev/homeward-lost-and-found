import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StatusBadge } from "@/components/items/badges";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/lib/chat/knowledge";
import { ITEM_STATUSES, ITEM_STATUS_INFO } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How it works & FAQ",
  description: "Learn how to report, search and safely reclaim items on Homeward.",
};

// Group questions so the page can be scanned instead of read top to bottom (Miller's law).
const GROUPS = [
  { title: "Getting started", ids: ["about", "account", "translate"] },
  { title: "Reporting items", ids: ["report-lost", "report-found", "photos", "verification", "manage"] },
  { title: "Finding and claiming", ids: ["search", "claim", "duration"] },
  { title: "Safety and privacy", ids: ["privacy", "safety", "moderation", "human"] },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="How Homeward works"
        description="Everything you need to report an item, find one, and get it back safely. Can't find an answer? Use the Need help? button at the bottom of the page."
      />

      <nav aria-label="On this page" className="mb-10 rounded-2xl border bg-card p-4">
        <p className="mb-2 text-sm font-semibold">On this page</p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          <li><a href="#steps" className="text-primary underline-offset-4 hover:underline">The three steps</a></li>
          <li><a href="#statuses" className="text-primary underline-offset-4 hover:underline">What statuses mean</a></li>
          {GROUPS.map((g) => (
            <li key={g.title}>
              <a href={`#${g.title.toLowerCase().replace(/\s+/g, "-")}`} className="text-primary underline-offset-4 hover:underline">
                {g.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="steps" aria-labelledby="steps-heading" className="mb-10">
        <h2 id="steps-heading" className="text-xl font-semibold">The three steps</h2>
        <ol className="mt-4 space-y-3">
          {[
            ["Report it", "Choose Report Lost Item or Report Found Item. A guided form takes about two minutes and saves a draft as you go."],
            ["Search and match", "Browse recent reports and filter by type, category, location, date and status."],
            ["Reconnect privately", "Send a request through Homeward. Finders check a private detail before arranging a safe handover."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4 rounded-2xl border bg-card p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild className="bg-lost hover:bg-lost/90"><Link href="/report/lost">Report Lost Item</Link></Button>
          <Button asChild className="bg-found hover:bg-found/90"><Link href="/report/found">Report Found Item</Link></Button>
        </div>
      </section>

      <section id="statuses" aria-labelledby="statuses-heading" className="mb-10">
        <h2 id="statuses-heading" className="text-xl font-semibold">What statuses mean</h2>
        <dl className="mt-4 divide-y rounded-2xl border bg-card">
          {ITEM_STATUSES.map((status) => (
            <div key={status} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <dt className="sm:w-48"><StatusBadge status={status} /></dt>
              <dd className="text-sm text-muted-foreground">{ITEM_STATUS_INFO[status].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      {GROUPS.map((group) => (
        <section key={group.title} id={group.title.toLowerCase().replace(/\s+/g, "-")} className="mb-8" aria-labelledby={`${group.title}-h`}>
          <h2 id={`${group.title}-h`} className="text-xl font-semibold">{group.title}</h2>
          <Accordion type="multiple" className="mt-3 rounded-2xl border bg-card px-4">
            {FAQ.filter((f) => group.ids.includes(f.id)).map((entry) => (
              <AccordionItem key={entry.id} value={entry.id}>
                <AccordionTrigger className="min-h-12 text-base">{entry.question}</AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <p>{entry.answer}</p>
                  {entry.links.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {entry.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href} className="text-sm font-medium text-primary underline underline-offset-4">{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
}
