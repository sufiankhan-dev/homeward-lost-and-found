import type { SearchFilters } from "./validation";

type FilterKey = keyof SearchFilters;

/** Builds a /browse URL from filters, optionally overriding or removing keys. */
export function browseHref(
  filters: SearchFilters,
  overrides: Partial<Record<FilterKey, string | number | undefined>> = {},
): string {
  const params = new URLSearchParams();
  const merged: Record<string, string | number | undefined> = { ...filters, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === "") continue;
    if (key === "page" && Number(value) <= 1) continue;
    params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/browse?${query}` : "/browse";
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
