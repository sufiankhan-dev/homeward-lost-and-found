import Link from "next/link";
import { cn } from "@/lib/utils";

/** URL-based tabs: the selection survives reloads and the back button. */
export function TabLinks({
  tabs,
  current,
  label,
}: {
  tabs: { value: string; label: string; count?: number; href: string }[];
  current: string;
  label: string;
}) {
  return (
    <nav aria-label={label}>
      <ul className="inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <li key={tab.value}>
            <Link
              href={tab.href}
              aria-current={tab.value === current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground",
                tab.value === current && "bg-card text-foreground shadow-sm",
              )}
            >
              {tab.label}
              {tab.count !== undefined && <span className="text-xs text-muted-foreground">({tab.count})</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
