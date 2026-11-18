"use client";

import { nativeSelectClass } from "@/components/form/field";
import { cn } from "@/lib/utils";

/** Native select that re-submits its form on change (immediate feedback). */
export function AutoSubmitSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={cn(nativeSelectClass, className)}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {children}
    </select>
  );
}
