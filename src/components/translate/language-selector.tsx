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
    <div className="notranslate flex items-center gap-2" translate="no">
      <label
        htmlFor={SELECT_ID}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      >
        <Languages className="size-4" aria-hidden />
        <span className="hidden lg:inline">Language</span>
        <span className="sr-only lg:hidden">Language</span>
      </label>
      <div className="relative w-[8.5rem] sm:w-40">
        <div
          id={CONTAINER_ID}
          ref={containerRef}
          className="[&_.goog-te-gadget]:leading-tight [&_.goog-te-gadget>span]:hidden [&_.goog-te-gadget]:text-[0px]!"
        />
        {state === "loading" && (
          <div
            className="h-10 animate-pulse rounded-xl border bg-muted"
            role="status"
            aria-label="Loading language options"
          />
        )}
        {state === "unavailable" && (
          <p className="text-xs leading-tight text-muted-foreground" role="status">
            Translation unavailable right now
          </p>
        )}
      </div>
      {translated && (
        <button
          type="button"
          onClick={showOriginal}
          className="inline-flex h-10 items-center gap-1 rounded-xl px-2 text-sm font-medium text-primary hover:bg-accent"
        >
          <RotateCcw className="size-4" aria-hidden />
          <span className="hidden sm:inline">Show original</span>
          <span className="sr-only sm:hidden">Show original English page</span>
        </button>
      )}
      <Script
        id="google-translate"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onError={() => setState("unavailable")}
      />
    </div>
  );
}
