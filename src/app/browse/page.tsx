import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, X } from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { EmptyState } from "@/components/page-header";
import { AutoSubmitSelect } from "@/components/search/auto-submit-select";
import { FilterForm } from "@/components/search/filter-form";
import { MobileFilters } from "@/components/search/mobile-filters";
import { SearchBox } from "@/components/search/search-box";
import { Button } from "@/components/ui/button";
import { ITEM_STATUS_INFO, PAGE_SIZE, type ItemStatus } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getCategories, searchItems } from "@/lib/items/queries";
import { browseHref, firstParam } from "@/lib/search-params";
import { searchFiltersSchema, type SearchFilters } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Browse items",
  description: "Search lost and found reports by keyword, category, location and date.",
};

export const dynamic = "force-dynamic";

export default async function BrowsePage(props: PageProps<"/browse">) {
  const raw = await props.searchParams;
  const filters: SearchFilters = searchFiltersSchema.parse(
    Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, firstParam(v) || undefined])),
  );
  const [result, categories] = await Promise.all([searchItems(filters), getCategories()]);
  const categoryName = categories.find((c) => c.slug === filters.category)?.name;

  // Every active filter is visible and removable in one click (recognition, user control).
  const chips: { label: string; href: string }[] = [];
  if (filters.q) chips.push({ label: `“${filters.q}”`, href: browseHref(filters, { q: undefined, page: undefined, sort: undefined }) });
  if (filters.type) chips.push({ label: filters.type === "LOST" ? "Lost items" : "Found items", href: browseHref(filters, { type: undefined, page: undefined }) });
  if (categoryName) chips.push({ label: categoryName, href: browseHref(filters, { category: undefined, page: undefined }) });
  if (filters.location) chips.push({ label: `Near “${filters.location}”`, href: browseHref(filters, { location: undefined, page: undefined }) });
  if (filters.from) chips.push({ label: `From ${formatDate(filters.from)}`, href: browseHref(filters, { from: undefined, page: undefined }) });
  if (filters.to) chips.push({ label: `Until ${formatDate(filters.to)}`, href: browseHref(filters, { to: undefined, page: undefined }) });
  if (filters.status && filters.status !== "active") {
    chips.push({
      label: filters.status === "all" ? "Any status" : ITEM_STATUS_INFO[filters.status as ItemStatus].label,
      href: browseHref(filters, { status: undefined, page: undefined }),
    });
  }
  const filterCount = chips.filter((c) => !c.label.startsWith("“")).length;

  const start = result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(result.page * PAGE_SIZE, result.total);
  const sort = filters.sort ?? (filters.q ? "relevance" : "newest");
  const filterForm = (prefix: string) => <FilterForm filters={filters} categories={categories} idPrefix={prefix} />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Browse lost &amp; found items</h1>
      <p className="mt-1 text-muted-foreground">Search by keyword, then narrow down with filters.</p>

      <div className="mt-6">
        <SearchBox
          defaultValue={filters.q}
          hiddenFields={{
            type: filters.type,
            category: filters.category,
            location: filters.location,
            from: filters.from,
            to: filters.to,
            status: filters.status,
          }}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr]">
        {/* Filters sit beside the results they control (mapping). */}
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24">{filterForm("desktop")}</div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-heading" className="text-base font-medium" aria-live="polite">
              {result.total === 0
                ? "No matching items"
                : `Showing ${start}–${end} of ${result.total} ${result.total === 1 ? "item" : "items"}`}
            </h2>
            <div className="flex items-center gap-2">
              <MobileFilters activeCount={filterCount}>{filterForm("mobile")}</MobileFilters>
              <form action="/browse" method="get" className="flex items-center gap-2">
                {Object.entries({ ...filters, sort: undefined, page: undefined }).map(([k, v]) =>
                  v ? <input key={k} type="hidden" name={k} value={String(v)} /> : null,
                )}
                <label htmlFor="sort" className="text-sm text-muted-foreground">
                  Sort
                </label>
                <AutoSubmitSelect id="sort" name="sort" defaultValue={sort} className="h-10 w-auto">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  {filters.q && <option value="relevance">Best match</option>}
                </AutoSubmitSelect>
                <noscript>
                  <Button type="submit" variant="outline" size="sm">
                    Apply
                  </Button>
                </noscript>
              </form>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border bg-card px-3 text-sm hover:border-destructive/40 hover:bg-destructive/5"
                >
                  {chip.label}
                  <X className="size-3.5" aria-hidden />
                  <span className="sr-only">(remove filter)</span>
                </Link>
              ))}
              <Link href="/browse" className="inline-flex min-h-9 items-center px-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
                Clear all
              </Link>
            </div>
          )}

          {result.items.length > 0 ? (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((item) => (
                <li key={item.id}>
                  <ItemCard item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={<PackageSearch />}
                title="Nothing matches yet"
                description={
                  chips.length > 0
                    ? "Try fewer filters or a different keyword. New reports arrive every day, so check back soon."
                    : "There are no open reports right now."
                }
              >
                {chips.length > 0 && (
                  <Button asChild variant="outline">
                    <Link href="/browse">Clear all filters</Link>
                  </Button>
                )}
                <Button asChild>
                  <Link href={filters.type === "LOST" ? "/report/found" : "/report/lost"}>
                    {filters.type === "LOST" ? "Report a found item" : "Report a lost item"}
                  </Link>
                </Button>
              </EmptyState>
            </div>
          )}

          {result.pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3">
              {result.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={browseHref(filters, { page: result.page - 1 })} rel="prev">
                    <ChevronLeft aria-hidden /> Previous
                  </Link>
                </Button>
              ) : (
                <span />
              )}
              <p className="text-sm text-muted-foreground">
                Page {result.page} of {result.pageCount}
              </p>
              {result.page < result.pageCount ? (
                <Button asChild variant="outline">
                  <Link href={browseHref(filters, { page: result.page + 1 })} rel="next">
                    Next <ChevronRight aria-hidden />
                  </Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
