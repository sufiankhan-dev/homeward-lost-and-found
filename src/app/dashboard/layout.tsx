import { NavLink } from "@/components/layout/nav-link";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/reports", label: "My reports" },
  { href: "/dashboard/requests", label: "Requests" },
  { href: "/dashboard/activity", label: "Activity" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm text-muted-foreground">Signed in as {user.name}</p>
      <nav aria-label="Dashboard" className="-mx-4 mt-2 mb-8 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 pb-2">
          {TABS.map((tab) => (
            <li key={tab.href}>
              <NavLink href={tab.href} exact={tab.exact}>
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
