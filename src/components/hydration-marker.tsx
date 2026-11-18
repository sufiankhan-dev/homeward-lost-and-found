"use client";

import { useEffect } from "react";

/**
 * Marks <html data-hydrated> once React is interactive. Automated tests wait
 * for it so they never type into a form before its handlers are attached.
 */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return null;
}
