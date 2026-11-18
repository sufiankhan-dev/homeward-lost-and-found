"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Keyword search that submits to /browse. Pressing "/" anywhere focuses it,
 * an accelerator for frequent users that stays out of the way of new users
 * (Shneiderman: shortcuts; Nielsen: flexibility and efficiency).
 */
export function SearchBox({
  defaultValue,
  size = "default",
  hiddenFields,
  autoFocusShortcut = true,
  className,
  label = "Search lost and found items",
}: {
  defaultValue?: string;
  size?: "default" | "lg";
  hiddenFields?: Record<string, string | undefined>;
  autoFocusShortcut?: boolean;
  className?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocusShortcut) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocusShortcut]);

  const large = size === "lg";

  return (
    <form action="/browse" method="get" role="search" className={cn("w-full", className)}>
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) =>
          value ? <input key={name} type="hidden" name={name} value={value} /> : null,
        )}
      <label htmlFor="site-search" className="sr-only">
        {label}
      </label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search
            className={cn(
              "pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground",
              large ? "size-5" : "size-4",
            )}
            aria-hidden
          />
          <input
            ref={inputRef}
            id="site-search"
            name="q"
            type="search"
            defaultValue={defaultValue}
            maxLength={100}
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Try “wallet”, “blue bottle” or “keys”"
            aria-describedby="site-search-hint"
            className={cn(
              "w-full rounded-xl border border-input bg-card pr-12 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              large ? "h-14 pl-11" : "h-11 pl-10",
            )}
          />
          <kbd
            className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border bg-muted px-1.5 text-xs text-muted-foreground sm:block"
            aria-hidden
          >
            /
          </kbd>
        </div>
        <Button type="submit" size={large ? "lg" : "default"} className={cn(large ? "h-14 px-6" : "h-11")}>
          Search
        </Button>
      </div>
      <p id="site-search-hint" className="sr-only">
        Searches item names, descriptions and categories. Press slash to jump here from anywhere.
      </p>
    </form>
  );
}
