"use client";

import Link from "next/link";
import { ChevronDown, HandHelping, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * One primary header action instead of two buttons (minimalist header).
 * The Lost / Found choice appears on demand, each with a clear label and hint.
 */
export function ReportMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus aria-hidden /> Report item <ChevronDown className="opacity-80" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DropdownMenuItem asChild className="min-h-14 gap-3 rounded-lg">
          <Link href="/report/lost">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-lost-soft text-lost">
              <Search className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">Report a lost item</span>
              <span className="block text-xs text-muted-foreground">I&apos;m missing something</span>
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-14 gap-3 rounded-lg">
          <Link href="/report/found">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-found-soft text-found">
              <HandHelping className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block font-semibold">Report a found item</span>
              <span className="block text-xs text-muted-foreground">I found something</span>
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
