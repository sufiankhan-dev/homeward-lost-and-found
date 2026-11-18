"use client";

import { useSyncExternalStore } from "react";

/**
 * Google Translate marks the <html> element with `translated-ltr` or
 * `translated-rtl` while a translation is active.
 */
function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "lang"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  const cls = document.documentElement.className;
  return cls.includes("translated-ltr") || cls.includes("translated-rtl");
}

export function usePageTranslated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
