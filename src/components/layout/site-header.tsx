import Link from "next/link";
import { HandHelping, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/translate/language-selector";
import { countUnreadActivity } from "@/lib/dashboard/queries";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";

export const NAV_ITEMS = [
  { href: "/browse", label: "Browse items" },
  { href: "/help", label: "How it works" },
] as const;

/**
 * Persistent header: the two primary actions and search are visible on every
 * page (visibility, Fitts's law), in the same place every time (consistency).
 */
export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await countUnreadActivity(user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />

          <div className="hidden items-center gap-2 lg:flex">
            <Button asChild variant="outline" className="border-lost/30 text-lost hover:bg-lost-soft hover:text-lost">
              <Link href="/report/lost">
                <Search aria-hidden /> Report lost
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-found/30 text-found hover:bg-found-soft hover:text-found">
              <Link href="/report/found">
                <HandHelping aria-hidden /> Report found
              </Link>
            </Button>
          </div>

          <div className="hidden md:flex">
            {user ? (
              <UserMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} unread={unread} />
            ) : (
              <div className="flex items-center gap-1">
                <Button asChild variant="ghost">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Create account</Link>
                </Button>
              </div>
            )}
          </div>

          <MobileNav
            user={user ? { name: user.name, isAdmin: user.role === "admin" } : null}
            unread={unread}
          />
        </div>
      </div>
    </header>
  );
}
