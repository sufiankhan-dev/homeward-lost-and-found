import Link from "next/link";
import { ArrowRight, HandHelping, MessagesSquare, PackageSearch, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CategoryIcon } from "@/components/items/category-icon";
import { ItemCard } from "@/components/items/item-card";
import { EmptyState } from "@/components/page-header";
import { SearchBox } from "@/components/search/search-box";
import { FAQ } from "@/lib/chat/knowledge";
import { getCategoriesWithCounts, getRecentItems } from "@/lib/items/queries";

export const dynamic = "force-dynamic";

const HOME_FAQ_IDS = ["about", "claim", "verification", "account", "privacy"];

const STEPS = [
  {
    icon: PackageSearch,
    title: "Report it",
    body: "Tell us what you lost or found, roughly where and when. Add a photo if you have one. It takes about two minutes.",
  },
  {
    icon: Search,
    title: "Search and match",
    body: "Browse recent reports with filters for category, place and date. No account needed to look.",
  },
  {
    icon: MessagesSquare,
    title: "Reconnect privately",
    body: "Send a request through Homeward. The finder checks a private detail, then you arrange a safe handover.",
  },
];

export default async function HomePage() {
  const [recent, categories] = await Promise.all([getRecentItems(6), getCategoriesWithCounts()]);
  // Show the busiest categories first; keep the list short (Hick-Hyman, Miller).
  const popular = [...categories]
    .filter((c) => c.slug !== "other")
    .sort((a, b) => b.openCount - a.openCount)
    .slice(0, 8);
  const faq = FAQ.filter((f) => HOME_FAQ_IDS.includes(f.id));

  return (
    <>
      {/* Hero: purpose, the two primary actions and search, all above the fold. */}
      <section className="border-b bg-gradient-to-b from-accent/50 to-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              Your phone number and email are never shown publicly
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Lost something on campus? Found something? Let&apos;s get it home.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Homeward is the university Lost &amp; Found. Report an item, search recent reports, and contact
              the finder or owner safely.
            </p>
          </div>

          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            <Link
              href="/report/lost"
              className="group flex min-h-20 items-center gap-4 rounded-2xl border-2 border-lost/30 bg-card p-4 transition hover:border-lost hover:bg-lost-soft focus-visible:border-lost"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lost text-white">
                <Search className="size-6" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-semibold">Report Lost Item</span>
                <span className="block text-sm text-muted-foreground">I&apos;m missing something</span>
              </span>
              <ArrowRight className="size-5 text-lost transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/report/found"
              className="group flex min-h-20 items-center gap-4 rounded-2xl border-2 border-found/30 bg-card p-4 transition hover:border-found hover:bg-found-soft focus-visible:border-found"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-found text-white">
                <HandHelping className="size-6" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block text-lg font-semibold">Report Found Item</span>
                <span className="block text-sm text-muted-foreground">I found something</span>
              </span>
              <ArrowRight className="size-5 text-found transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-6 max-w-3xl">
            <SearchBox size="lg" />
          </div>
        </div>
      </section>

      {/* Recently reported */}
      <section aria-labelledby="recent-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="recent-heading" className="text-2xl font-semibold">
              Recently reported
            </h2>
            <p className="mt-1 text-muted-foreground">The newest open reports from around campus.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/browse">
              View all items <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        {recent.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <li key={item.id} className="flex">
                <div className="w-full">
                  <ItemCard item={item} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<PackageSearch />}
            title="No open reports yet"
            description="When people report lost or found items, the newest ones will appear here."
          >
            <Button asChild>
              <Link href="/report/found">Report a found item</Link>
            </Button>
          </EmptyState>
        )}
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading" className="border-y bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 id="categories-heading" className="text-2xl font-semibold">
            Popular categories
          </h2>
          <p className="mt-1 mb-6 text-muted-foreground">Jump straight to the kind of item you&apos;re looking for.</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {popular.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/browse?category=${category.slug}`}
                  className="flex min-h-16 items-center gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:bg-accent"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <CategoryIcon icon={category.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm leading-tight font-semibold">{category.name}</span>
                    <span className="text-xs text-muted-foreground">{category.openCount} open</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/browse"
            className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            See all {categories.length} categories <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 id="how-heading" className="text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <step.icon className="size-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <h2 id="faq-heading" className="text-2xl font-semibold">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="mt-4 rounded-2xl border bg-card px-4">
          {faq.map((entry) => (
            <AccordionItem key={entry.id} value={entry.id}>
              <AccordionTrigger className="min-h-12 text-base">{entry.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{entry.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-4 text-sm text-muted-foreground">
          More questions? Read the{" "}
          <Link href="/help" className="font-medium text-primary underline underline-offset-4">
            full help guide
          </Link>{" "}
          or select <strong>Need help?</strong> at the bottom of any page.
        </p>
      </section>
    </>
  );
}
