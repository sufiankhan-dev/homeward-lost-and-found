"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Languages, RotateCcw } from "lucide-react";
import { usePageTranslated } from "./use-page-translation";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages?: string; autoDisplay?: boolean },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

const CONTAINER_ID = "google_translate_element";
const SELECT_ID = "site-language";
const PANEL_ID = "language-panel";

/** Common languages for a diverse campus; Google's widget lists them by name. */
const INCLUDED_LANGUAGES = "ar,bn,de,es,fa,fr,hi,id,it,ja,ko,ms,pa,pt,ru,sw,tr,ur,vi,zh-CN";

/**
 * Official Google Website Translator integration. The widget renders a native
 * <select>, which is keyboard and screen-reader accessible; we label it and
 * style it to match the site. A "Show original" control gives users an easy
 * way back (user control and freedom).
 */
export function LanguageSelector() {
  const [state, setState] = useState<"loading" | "ready" | "unavailable">("loading");
  const translated = usePageTranslated();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  // Close on outside click or Esc; Esc returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    document.getElementById(SELECT_ID)?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate || !document.getElementById(CONTAINER_ID)) return;
      if (containerRef.current?.querySelector(".goog-te-combo")) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: INCLUDED_LANGUAGES, autoDisplay: false },
        CONTAINER_ID,
      );
    };
    // The script may already be loaded after client-side navigation.
    if (window.google?.translate) window.googleTranslateElementInit();

    const container = containerRef.current;
    if (!container) return;
    const enhance = (select: HTMLSelectElement) => {
      // Only write when something changes: writes are DOM mutations and would
      // otherwise re-trigger the observer in an endless loop.
      if (select.id !== SELECT_ID) select.id = SELECT_ID;
      if (select.getAttribute("aria-label") !== "Translate this page") {
        select.setAttribute("aria-label", "Translate this page");
      }
      const first = select.options[0];
      if (first && !first.value && first.textContent !== "English (original)") {
        first.textContent = "English (original)";
      }
    };
    const observer = new MutationObserver(() => {
      const select = container.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (!select) return;
      // Google fills the options asynchronously; wait until they exist.
      if (select.options.length > 1) {
        observer.disconnect();
        enhance(select);
        setState("ready");
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => {
      const select = container.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (!select || select.options.length <= 1) setState("unavailable");
    }, 10_000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  function showOriginal() {
    const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    const host = window.location.hostname;
    document.cookie = `googtrans=; ${expired}`;
    document.cookie = `googtrans=; ${expired}; domain=${host}`;
    document.cookie = `googtrans=; ${expired}; domain=.${host}`;
    window.location.reload();
  }

  return (
    <div ref={wrapperRef} className="notranslate relative" translate="no">
      {/* Compact trigger keeps the header uncluttered; the panel holds the real widget. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        aria-label={translated ? "Language (page is translated)" : "Language"}
        title="Translate this page"
        className="relative inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <Languages className="size-5" aria-hidden />
        {translated && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" aria-hidden />
        )}
      </button>

      {/* Always mounted (hidden when closed) so Google's widget isn't destroyed. */}
      <div
        id={PANEL_ID}
        hidden={!open}
        className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-lg"
      >
        <label htmlFor={SELECT_ID} className="mb-2 block text-sm font-semibold">
          Translate this page
        </label>
        <div
          id={CONTAINER_ID}
          ref={containerRef}
          className="[&_.goog-te-gadget]:leading-tight [&_.goog-te-gadget>span]:hidden [&_.goog-te-gadget]:text-[0px]!"
        />
        {state === "loading" && (
          <div className="h-10 animate-pulse rounded-xl border bg-muted" role="status" aria-label="Loading language options" />
        )}
        {state === "unavailable" && (
          <p className="text-sm text-muted-foreground" role="status">
            Translation unavailable right now
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Powered by Google Translate. Machine translations may be inaccurate.</p>
        {translated && (
          <button
            type="button"
            onClick={showOriginal}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-sm font-medium text-primary hover:bg-accent"
          >
            <RotateCcw className="size-4" aria-hidden />
            Show original (English)
          </button>
        )}
      </div>
      <Script
        id="google-translate"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onError={() => setState("unavailable")}
      />
    </div>
  );
}
