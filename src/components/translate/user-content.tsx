"use client";

import { Languages } from "lucide-react";
import { usePageTranslated } from "./use-page-translation";

/**
 * Wraps text written by community members. When the page is machine
 * translated, it is labelled as such so readers know it isn't the author's
 * original wording.
 */
export function UserContent({
  children,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  as?: "div" | "p" | "span";
  className?: string;
}) {
  const translated = usePageTranslated();
  return (
    <Tag className={className}>
      {children}
      {translated && (
        <span className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground italic">
          <Languages className="size-3.5" aria-hidden />
          Machine-translated by Google from the reporter&apos;s original text.
        </span>
      )}
    </Tag>
  );
}
