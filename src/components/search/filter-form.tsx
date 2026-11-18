import Link from "next/link";
import { CAMPUS_LOCATIONS, ITEM_STATUS_INFO, ITEM_STATUSES } from "@/lib/constants";
import { nativeSelectClass } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SearchFilters } from "@/lib/validation";

type Category = { id: number; name: string; slug: string };

/**
 * GET form so filters work without JavaScript and live in the URL (shareable,
 * back-button friendly). Primary filters are always shown; secondary ones sit
 * under "More filters" (progressive disclosure, Hick-Hyman).
 */
export function FilterForm({
  filters,
  categories,
  idPrefix,
}: {
  filters: SearchFilters;
  categories: Category[];
  idPrefix: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const hasSecondary = Boolean(filters.location || filters.from || filters.to || (filters.status && filters.status !== "active"));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action="/browse" method="get" className="space-y-6" aria-label="Filter listings">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Report type</legend>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {[
            { value: "", label: "All" },
            { value: "LOST", label: "Lost" },
            { value: "FOUND", label: "Found" },
          ].map((option) => (
            <label
              key={option.value}
              className="relative flex min-h-10 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-muted-foreground has-[:checked]:bg-card has-[:checked]:text-foreground has-[:checked]:shadow-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                defaultChecked={(filters.type ?? "") === option.value}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={id("category")} className="text-sm font-semibold">
          Category
        </label>
        <select id={id("category")} name="category" defaultValue={filters.category ?? ""} className={nativeSelectClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <details open={hasSecondary} className="group rounded-xl border bg-card">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          More filters
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">Location, date, status</span>
          <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">Hide</span>
        </summary>
        <div className="space-y-5 border-t p-3.5">
          <div className="space-y-2">
            <label htmlFor={id("location")} className="text-sm font-semibold">
              Location contains
            </label>
            <Input
              id={id("location")}
              name="location"
              defaultValue={filters.location}
              list={id("locations")}
              placeholder="e.g. Library"
              maxLength={120}
            />
            <datalist id={id("locations")}>
              {CAMPUS_LOCATIONS.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Date lost or found</legend>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor={id("from")} className="text-xs text-muted-foreground">
                  From
                </label>
                <Input id={id("from")} type="date" name="from" max={today} defaultValue={filters.from} />
              </div>
              <div className="space-y-1">
                <label htmlFor={id("to")} className="text-xs text-muted-foreground">
                  To
                </label>
                <Input id={id("to")} type="date" name="to" max={today} defaultValue={filters.to} />
              </div>
            </div>
          </fieldset>
          <div className="space-y-2">
            <label htmlFor={id("status")} className="text-sm font-semibold">
              Status
            </label>
            <select id={id("status")} name="status" defaultValue={filters.status ?? "active"} className={nativeSelectClass}>
              <option value="active">Active (Open or claim in progress)</option>
              {ITEM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ITEM_STATUS_INFO[s].label} only
                </option>
              ))}
              <option value="all">Any status</option>
            </select>
          </div>
        </div>
      </details>

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg">
          Apply filters
        </Button>
        <Button asChild variant="ghost">
          <Link href={filters.q ? `/browse?q=${encodeURIComponent(filters.q)}` : "/browse"}>Reset filters</Link>
        </Button>
      </div>
    </form>
  );
}
