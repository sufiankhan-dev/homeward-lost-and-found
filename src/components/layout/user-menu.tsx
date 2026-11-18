"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { LayoutDashboard, LogOut, Settings, ShieldCheck, Inbox, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function useSignOut() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const signOut = () =>
    startTransition(async () => {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error("We couldn't sign you out. Please try again.");
        return;
      }
      toast.success("You've been signed out.");
      router.push("/");
      router.refresh();
    });
  return { signOut, pending };
}

export function UserMenu({
  name,
  email,
  isAdmin,
  unread,
}: {
  name: string;
  email: string;
  isAdmin: boolean;
  unread: number;
}) {
  const { signOut, pending } = useSignOut();
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 pr-2 pl-1.5" aria-label={`Account menu for ${name}${unread ? `, ${unread} new updates` : ""}`}>
          <span className="relative flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {initials}
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] leading-4 text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block font-semibold">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/dashboard">
            <LayoutDashboard aria-hidden /> Dashboard
            {unread > 0 && <span className="ml-auto text-xs text-muted-foreground">{unread} new</span>}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/dashboard/requests">
            <Inbox aria-hidden /> Requests & messages
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-10">
          <Link href="/dashboard/settings">
            <Settings aria-hidden /> Profile settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild className="min-h-10">
            <Link href="/admin">
              <ShieldCheck aria-hidden /> Moderation
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-10" disabled={pending} onSelect={signOut}>
          <LogOut aria-hidden /> {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
