"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HandHelping,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "./nav-link";
import { useSignOut } from "./user-menu";

export function MobileNav({
  user,
  unread,
}: {
  user: { name: string; isAdmin: boolean } | null;
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const { signOut, pending } = useSignOut();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85vw] max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>{user ? `Signed in as ${user.name}` : "Browse, report and get help."}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-6">
          <Button asChild size="lg" className="justify-start bg-lost text-white hover:bg-lost/90">
            <Link href="/report/lost" onClick={close}>
              <Search aria-hidden /> Report lost item
            </Link>
          </Button>
          <Button asChild size="lg" className="justify-start bg-found text-white hover:bg-found/90">
            <Link href="/report/found" onClick={close}>
              <HandHelping aria-hidden /> Report found item
            </Link>
          </Button>
          <Separator className="my-2" />
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            <NavLink href="/" exact onNavigate={close} className="min-h-11 text-base">
              Home
            </NavLink>
            <NavLink href="/browse" onNavigate={close} className="min-h-11 text-base">
              Browse items
            </NavLink>
            <NavLink href="/help" onNavigate={close} className="min-h-11 text-base">
              How it works & FAQ
            </NavLink>
            {user && (
              <>
                <Separator className="my-2" />
                <NavLink href="/dashboard" exact onNavigate={close} className="min-h-11 text-base">
                  <LayoutDashboard className="size-4" aria-hidden /> Dashboard
                  {unread > 0 && <span className="ml-auto text-xs">{unread} new</span>}
                </NavLink>
                <NavLink href="/dashboard/requests" onNavigate={close} className="min-h-11 text-base">
                  <Inbox className="size-4" aria-hidden /> Requests & messages
                </NavLink>
                <NavLink href="/dashboard/settings" onNavigate={close} className="min-h-11 text-base">
                  <Settings className="size-4" aria-hidden /> Profile settings
                </NavLink>
                {user.isAdmin && (
                  <NavLink href="/admin" onNavigate={close} className="min-h-11 text-base">
                    <ShieldCheck className="size-4" aria-hidden /> Moderation
                  </NavLink>
                )}
              </>
            )}
          </nav>
          <Separator className="my-2" />
          {user ? (
            <Button
              variant="outline"
              size="lg"
              className="justify-start"
              disabled={pending}
              onClick={() => {
                close();
                signOut();
              }}
            >
              <LogOut aria-hidden /> {pending ? "Signing out…" : "Sign out"}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="lg">
                <Link href="/sign-in" onClick={close}>
                  Sign in
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/sign-up" onClick={close}>
                  Create account
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
