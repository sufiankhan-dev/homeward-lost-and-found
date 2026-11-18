"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Bot, MessageCircleQuestion, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GREETING, SUGGESTED_QUESTIONS, type ChatLink } from "@/lib/chat/knowledge";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  links?: ChatLink[];
  notice?: string;
};

const STORAGE_KEY = "homeward-chat-v1";
const MAX_LENGTH = 1000;

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : [];
  } catch {
    return [];
  }
}

/**
 * Global help assistant (Nielsen #10: help and documentation).
 * - Launcher is large and always in the same corner (Fitts's law, consistency).
 * - Typing indicator, errors with retry (visibility of system status).
 * - Esc or the close button closes it; focus returns to the launcher.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; retryText: string } | null>(null);
  const panelId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const restored = useRef(false);

  function openPanel() {
    // Restore this tab's conversation on first open (keeps server markup stable).
    if (!restored.current) {
      restored.current = true;
      const history = loadHistory();
      if (history.length && messages.length === 0) setMessages(history);
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    // Esc closes the panel even if focus has moved outside it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        setOpen(false);
        requestAnimationFrame(() => launcherRef.current?.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, loading, open]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_LENGTH);
    if (!content || loading) return;
    setError(null);
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-12).map(({ role, content }) => ({ role, content })),
          pathname,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { reply: string; links: ChatLink[]; notice?: string }
        | { error: string }
        | null;
      if (!response.ok || !data || "error" in data) {
        throw new Error(data && "error" in data ? data.error : "The assistant couldn't respond.");
      }
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply, links: data.links, notice: data.notice },
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setError({
        message:
          err instanceof Error && err.message !== "Failed to fetch"
            ? err.message
            : "You seem to be offline. Check your connection and try again.",
        retryText: content,
      });
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div>
      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${panelId}-title`}
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[min(85dvh,640px)] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Bot className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={`${panelId}-title`} className="text-sm font-semibold">
                Homeward help
              </h2>
              <p className="text-xs text-muted-foreground">Answers about using the site · no personal data</p>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon-sm" onClick={clearConversation} aria-label="Start a new conversation">
                <RotateCcw aria-hidden />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close help chat">
              <X aria-hidden />
            </Button>
          </header>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            tabIndex={0}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 focus-visible:outline-offset-[-3px]"
          >
            <AssistantBubble content={GREETING} />
            {messages.length === 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium text-muted-foreground">Popular questions</p>
                <ul className="flex flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        onClick={() => send(q)}
                        className="min-h-10 w-full rounded-xl border bg-background px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-accent"
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
                    <span className="sr-only">You said: </span>
                    {m.content}
                  </p>
                </div>
              ) : (
                <AssistantBubble key={m.id} content={m.content} links={m.links} notice={m.notice} onNavigate={close} />
              ),
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </span>
                Assistant is typing…
              </div>
            )}
            {error && (
              <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <p className="font-medium text-destructive">Message not sent</p>
                <p className="mt-1 text-muted-foreground">{error.message}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => send(error.retryText)}>
                  <RotateCcw aria-hidden /> Try again
                </Button>
              </div>
            )}
          </div>

          <form
            className="border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor={`${panelId}-input`} className="sr-only">
              Ask a question
            </label>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                id={`${panelId}-input`}
                rows={1}
                value={input}
                maxLength={MAX_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask how to report, search, claim…"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm"
              />
              <Button type="submit" size="icon" className="size-11" disabled={!input.trim() || loading} aria-label="Send message">
                <Send aria-hidden />
              </Button>
            </div>
            <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
              Enter to send · Shift+Enter for a new line · Esc to close
            </p>
          </form>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : openPanel())}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          "fixed right-4 bottom-4 z-50 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 sm:right-6 sm:bottom-6",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-5" aria-hidden /> : <MessageCircleQuestion className="size-5" aria-hidden />}
        <span>{open ? "Close help" : "Need help?"}</span>
      </button>
    </div>
  );
}

function AssistantBubble({
  content,
  links,
  notice,
  onNavigate,
}: {
  content: string;
  links?: ChatLink[];
  notice?: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex gap-2">
      <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground" aria-hidden>
        <Bot className="size-4" />
      </span>
      <div className="max-w-[85%] space-y-2">
        <p className="rounded-2xl rounded-tl-md bg-muted px-3.5 py-2 text-sm whitespace-pre-wrap">
          <span className="sr-only">Assistant: </span>
          {content}
        </p>
        {notice && <p className="text-xs text-muted-foreground italic">{notice}</p>}
        {links && links.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-sm font-medium text-primary hover:bg-accent"
                >
                  {link.label}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
