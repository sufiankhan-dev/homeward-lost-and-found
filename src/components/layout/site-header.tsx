import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/translate/language-selector";
import { countUnreadActivity } from "@/lib/dashboard/queries";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { ReportMenu } from "./report-menu";
import { UserMenu } from "./user-menu";

export const NAV_ITEMS = [
  { href: "/browse", label: "Browse" },
  { href: "/help", label: "How it works" },
] as const;

/**
 * Minimal persistent header: two navigation links on the left; language,
 * one "Report item" action and the account on the right. Everything else
 * lives in the account menu, the mobile menu or the footer.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await countUnreadActivity(user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSelector />

          <div className="hidden items-center gap-1.5 md:flex">
            <ReportMenu />
            {user ? (
              <UserMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} unread={unread} />
            ) : (
              <Button asChild variant="ghost">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>

          <MobileNav user={user ? { name: user.name, isAdmin: user.role === "admin" } : null} unread={unread} />
        </div>
      </div>
    </header>
  );
}
