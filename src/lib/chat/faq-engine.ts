import { FAQ, LINKS, type ChatLink, type FaqEntry } from "./knowledge";

const normalize = (s: string) =>
  ` ${s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\s]/g, " ").replace(/\s+/g, " ").trim()} `;

export function matchFaq(message: string): { entry: FaqEntry; score: number } | null {
  const text = normalize(message);
  let best: { entry: FaqEntry; score: number } | null = null;
  for (const entry of FAQ) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (text.includes(` ${keyword} `) || (keyword.includes(" ") && text.includes(keyword))) {
        score += keyword.includes(" ") ? 3 : 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  return best;
}

const STOP_WORDS = new Set(
  (
    "i me my mine we our you your a an the this that these those is are was were be been am " +
    "have has had do does did lost lose losing found find finding missing seen see anyone someone somebody " +
    "has anybody any help please can could would will should if it its in on at near around by of to for from " +
    "with without and or but so just maybe think thought looking look searching search left leave dropped " +
    "yesterday today morning afternoon evening night last week campus somewhere item thing things stuff " +
    "hi hello hey there how what where when who why which report reported someone's got get"
  ).split(" "),
);

export type SearchIntent = {
  query: string;
  /** Which kind of listing could contain the user's item. */
  lookFor: "LOST" | "FOUND";
  userSituation: "lost" | "found";
};

/**
 * Detects messages like "I lost my black wallet" or "has anyone found keys?"
 * and extracts a keyword query. The caller must check the database before
 * saying anything about matches.
 */
export function detectSearchIntent(message: string): SearchIntent | null {
  const text = normalize(message);
  const lostSignal = /\b(i lost|lost my|i've lost|ive lost|missing my|can't find my|cant find my|has anyone (found|seen)|anyone (found|seen)|did anyone find|looking for my)\b/.test(text);
  const foundSignal = /\b(i found|found a|found an|found some|i picked up|picked up a|i have someone's|whose is)\b/.test(text);
  if (!lostSignal && !foundSignal) return null;

  const words = text
    .trim()
    .split(" ")
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
  if (words.length === 0) return null;

  const query = words.slice(0, 4).join(" ");
  return lostSignal
    ? { query, lookFor: "FOUND", userSituation: "lost" }
    : { query, lookFor: "LOST", userSituation: "found" };
}

export type ChatReply = {
  reply: string;
  links: ChatLink[];
};

export const UNKNOWN_REPLY: ChatReply = {
  reply:
    "I'm not sure about that one, and I don't want to guess. I can help with reporting lost or found items, searching, report statuses, contacting someone safely, and managing your reports. You can also read the Help page or contact the Lost & Found desk.",
  links: [LINKS.help, LINKS.contact],
};

/** Deterministic answer used when no AI service is configured or it fails. */
export function faqReply(message: string): ChatReply {
  const text = normalize(message);
  if (/^\s*(hi|hello|hey|good (morning|afternoon|evening))\b/.test(text) && text.trim().split(" ").length <= 3) {
    return {
      reply: "Hello! Ask me how to report an item, search listings, or contact someone safely.",
      links: [LINKS.reportLost, LINKS.reportFound, LINKS.browse],
    };
  }
  if (/\b(thanks|thank you|cheers)\b/.test(text)) {
    return { reply: "You're welcome! Good luck — I hope it finds its way home.", links: [] };
  }
  const match = matchFaq(message);
  if (!match) return UNKNOWN_REPLY;
  return { reply: match.entry.answer, links: match.entry.links };
}
