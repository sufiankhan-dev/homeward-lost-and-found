/**
 * Approved platform information for the help assistant. Both the FAQ engine
 * and the AI mode are grounded in this content only.
 */
export type ChatLink = { label: string; href: string };

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  /** Lower-case keywords/phrases; phrases score higher than single words. */
  keywords: string[];
  links: ChatLink[];
};

export const LINKS = {
  reportLost: { label: "Report a lost item", href: "/report/lost" },
  reportFound: { label: "Report a found item", href: "/report/found" },
  browse: { label: "Browse all listings", href: "/browse" },
  dashboard: { label: "Open my dashboard", href: "/dashboard" },
  requests: { label: "View my requests", href: "/dashboard/requests" },
  help: { label: "Help & FAQ", href: "/help" },
  signUp: { label: "Create an account", href: "/sign-up" },
  signIn: { label: "Sign in", href: "/sign-in" },
  privacy: { label: "Privacy & safety", href: "/privacy" },
  contact: { label: "Contact the Lost & Found desk", href: "/contact" },
  settings: { label: "Profile settings", href: "/dashboard/settings" },
} satisfies Record<string, ChatLink>;

export const FAQ: FaqEntry[] = [
  {
    id: "about",
    question: "What is Homeward and how does it work?",
    answer:
      "Homeward is the campus Lost & Found. It works in three steps: 1) Report what you lost or found, with the date, a general location and an optional photo. 2) Search recent reports — anyone can browse without an account. 3) When you spot a match, send a private request through the site. Nobody's phone number or email is ever shown publicly.",
    keywords: ["how does", "how it works", "what is", "about", "homeward", "explain", "platform", "use this", "work"],
    links: [LINKS.browse, LINKS.help],
  },
  {
    id: "report-lost",
    question: "How do I report a lost item?",
    answer:
      "Choose “Report Lost Item”. A short guided form asks for: what the item is, a category, a description, the date you lost it, and the general area. You can add a photo and distinguishing features (colour, brand, stickers). You'll see a review step before submitting, and your draft is saved on this device if you get interrupted. You need a free account so people can reach you privately.",
    keywords: ["report lost", "lost item", "i lost", "lost my", "missing", "report a lost", "can't find my", "cant find my", "lost something"],
    links: [LINKS.reportLost, LINKS.browse],
  },
  {
    id: "report-found",
    question: "How do I report a found item?",
    answer:
      "Thank you for helping! Choose “Report Found Item” and describe what you found, where and when. Keep at least one identifying detail private — for example, what's inside a wallet or a sticker on a laptop. Homeward stores that privately so you can check a claimant's answer. If you've handed the item to the Student Services desk, choose that as the handover option.",
    keywords: ["report found", "found item", "i found", "found a", "found something", "picked up", "handed in", "report a found"],
    links: [LINKS.reportFound],
  },
  {
    id: "search",
    question: "How do I search and filter listings?",
    answer:
      "Type a keyword such as “wallet” or “blue bottle” into the search box — it checks titles, descriptions and categories. On the Browse page you can filter by Lost or Found, category, location, date range and status. Your active filters appear as chips above the results; select a chip to remove it, or use “Clear all”. Tip: press “/” on any page to jump to the search box.",
    keywords: ["search", "filter", "find", "look for", "browse", "sort", "keyword", "date range", "category", "location"],
    links: [LINKS.browse],
  },
  {
    id: "statuses",
    question: "What do the report statuses mean?",
    answer:
      "Open: still looking, requests are welcome. Claim in progress: the reporter accepted a request and a handover is being arranged. Reunited: the item is back with its owner. Closed: the reporter closed the listing, so it no longer accepts requests. Each status is shown as a labelled badge on the listing.",
    keywords: ["status", "statuses", "open", "pending", "claim in progress", "reunited", "resolved", "closed", "what does", "mean"],
    links: [LINKS.browse],
  },
  {
    id: "claim",
    question: "How do I contact someone or claim an item?",
    answer:
      "Open the listing and choose “This is mine” (for found items) or “I may have found this” (for lost items). Write a short message; for found items you'll also describe a private detail that proves it's yours. The reporter is notified on their dashboard and can accept or decline. Once accepted, you both get a private conversation to arrange the handover. Contact details are never shared automatically.",
    keywords: ["claim", "contact", "message", "reach", "owner", "finder", "get it back", "this is mine", "request", "reply", "talk to"],
    links: [LINKS.requests, LINKS.browse],
  },
  {
    id: "verification",
    question: "What should I keep private when reporting a found item?",
    answer:
      "Don't publish everything. Keep one or two details private — contents of a bag or wallet, a serial number, an engraving, a lock-screen picture, or the name on a card. Put them in the “Private verification details” field: only you can see it. When someone claims the item, compare their answer with your note before arranging a handover.",
    keywords: ["private", "verification", "verify", "prove", "secret", "keep private", "identifying", "details", "fake claim", "scam"],
    links: [LINKS.reportFound, LINKS.privacy],
  },
  {
    id: "manage",
    question: "How do I edit, close or delete my report?",
    answer:
      "Go to your dashboard and open “My reports”. Each report has Edit, Mark as reunited, Close and Delete options. Closing and reopening can be undone straight away from the confirmation message. Deleting is permanent, so you'll be asked to confirm. Only you (or a moderator) can change your reports.",
    keywords: ["edit", "change", "update", "close", "delete", "remove", "my report", "mark as", "reunited", "reopen", "undo"],
    links: [LINKS.dashboard],
  },
  {
    id: "photos",
    question: "Can I add photos?",
    answer:
      "Yes — up to 3 photos per report, in JPG, PNG or WebP format, 5 MB each. You'll see upload progress for each photo. Photos are re-saved by Homeward, which removes hidden location data (EXIF). Avoid photographing cards or documents in a way that shows personal numbers.",
    keywords: ["photo", "photos", "picture", "image", "upload", "camera", "jpg", "png"],
    links: [LINKS.reportLost, LINKS.reportFound],
  },
  {
    id: "account",
    question: "Do I need an account?",
    answer:
      "No account is needed to browse or search. You need a free account to submit a report, send a request or reply to messages — this keeps contact private and lets you track updates on your dashboard. You can change your name and password in Profile settings.",
    keywords: ["account", "sign up", "signup", "register", "log in", "login", "sign in", "password", "forgot", "profile", "name"],
    links: [LINKS.signUp, LINKS.signIn, LINKS.settings],
  },
  {
    id: "privacy",
    question: "Is my personal information safe?",
    answer:
      "Your email, phone number and student ID are never shown on listings. Other people only see your first name. Messages happen inside Homeward, and you decide what to share. Please don't put phone numbers or emails in listing text — the form will warn you if you do.",
    keywords: ["privacy", "safe", "personal", "information", "email", "phone", "number", "data", "share", "security"],
    links: [LINKS.privacy],
  },
  {
    id: "safety",
    question: "How do I hand over an item safely?",
    answer:
      "Meet in a busy public place on campus during the day, such as the Student Union or the library entrance — or use the Student Services Lost & Found desk. Check the claimant's private detail before handing anything over. Never send money to get an item back.",
    keywords: ["meet", "handover", "hand over", "safe", "safely", "desk", "collect", "pick up", "return"],
    links: [LINKS.contact, LINKS.privacy],
  },
  {
    id: "moderation",
    question: "How do I report a suspicious listing?",
    answer:
      "On any listing, choose “Report listing” and pick a reason, such as spam, duplicate, misleading or showing personal information. Moderators review reports and can hide, close or merge listings. The person who posted it is told what changed.",
    keywords: ["suspicious", "spam", "fake", "report listing", "flag", "inappropriate", "duplicate", "moderator", "abuse"],
    links: [LINKS.browse],
  },
  {
    id: "translate",
    question: "Can I use the site in another language?",
    answer:
      "Yes. Use the “Language” selector in the top bar to translate the page with Google Translate. Text written by other people is machine-translated and is marked as such, so check important details with the reporter.",
    keywords: ["language", "translate", "translation", "urdu", "arabic", "spanish", "french", "chinese", "english"],
    links: [],
  },
  {
    id: "duration",
    question: "How long do listings stay up?",
    answer:
      "Listings stay visible until the reporter marks them as reunited or closes them. Browse shows active listings (Open and Claim in progress) by default; switch the Status filter to “Any status” to see older ones too.",
    keywords: ["how long", "expire", "stay", "old listings", "duration", "remain"],
    links: [LINKS.browse],
  },
  {
    id: "human",
    question: "How do I contact a person?",
    answer:
      "You can visit or contact the Student Services Lost & Found desk. Their opening hours and location are on the Contact page.",
    keywords: ["human", "person", "staff", "support", "help desk", "contact us", "office", "phone you", "speak to"],
    links: [LINKS.contact],
  },
];

export const GREETING =
  "Hi! I'm the Homeward help assistant. I can explain how to report or find an item, what statuses mean, and how to contact someone safely. What do you need help with?";

export const SUGGESTED_QUESTIONS = [
  "How do I report a lost item?",
  "I found something — what should I do?",
  "What do the statuses mean?",
  "How do I contact the finder?",
];

/** Text version of the knowledge base, used to ground the AI model. */
export function knowledgeAsText(): string {
  return FAQ.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
}
