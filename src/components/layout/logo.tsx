import Link from "next/link";
import { SITE } from "@/lib/constants";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-2.5 rounded-lg font-semibold"
      aria-label={`${SITE.name} home`}
    >
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M8 15.5 16 9l8 6.5V23a1 1 0 0 1-1 1h-4.5v-5h-5v5H9a1 1 0 0 1-1-1z"
          className="fill-primary-foreground"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-lg tracking-tight">{SITE.name}</span>
        <span className="hidden text-[0.7rem] font-medium text-muted-foreground sm:block">
          {SITE.tagline}
        </span>
      </span>
    </Link>
  );
}
