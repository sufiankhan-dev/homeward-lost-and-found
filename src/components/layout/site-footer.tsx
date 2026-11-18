import Link from "next/link";
import { SITE } from "@/lib/constants";

const GROUPS = [
  {
    title: "Use Homeward",
    links: [
      { href: "/browse", label: "Browse items" },
      { href: "/report/lost", label: "Report a lost item" },
      { href: "/report/found", label: "Report a found item" },
      { href: "/dashboard", label: "My dashboard" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/help", label: "How it works & FAQ" },
      { href: "/help#statuses", label: "Report statuses" },
      { href: "/privacy", label: "Privacy & safety" },
      { href: "/contact", label: "Contact the desk" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-secondary/60 pb-24 sm:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-lg font-semibold">
            {SITE.name} <span className="font-normal text-muted-foreground">· {SITE.tagline}</span>
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{SITE.description}</p>
          <p className="text-xs text-muted-foreground">
            Page translation powered by Google Translate. Machine translations may be inaccurate.
          </p>
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="mb-3 text-sm font-semibold">{group.title}</h2>
            <ul className="space-y-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} {SITE.name}. A university HCI project.
      </p>
    </footer>
  );
}
