# HCI implementation map

This document explains **where** each required HCI principle and usability law is implemented in Homeward, with the file that implements it. Every item below is a real interface decision you can see and test, not just a statement.

> Paths are relative to the repository root. "E2E" refers to the Playwright tests in `tests/e2e`.

---

## 1. Don Norman's six design principles

| Principle | Where it appears | Implementation |
|---|---|---|
| **Visibility** | Header on every page | A deliberately minimal header: two links (Browse, How it works), a language icon, one primary **Report item** action (which opens Lost / Found) and the account. Lower-priority links live in the account menu and footer. On small screens, Report lost and Report found are the first two items in the menu, and the home page shows both as large buttons. `src/components/layout/site-header.tsx`, `report-menu.tsx`, `mobile-nav.tsx` |
| | Current location | Active navigation links use `aria-current="page"` and a highlighted style. `nav-link.tsx` |
| | Listing state | Every listing shows a labelled Lost/Found badge and a status badge (Open, Claim in progress, Reunited, Closed). `src/components/items/badges.tsx` |
| | Active filters | Selected filters appear as removable chips above results. `src/app/browse/page.tsx` |
| | Form progress | The report form shows a 4-step progress bar with the current step. `src/components/report/report-form.tsx` |
| **Feedback** | Search | Results heading announces "Showing 1–12 of 30 items" through an `aria-live` region. `browse/page.tsx` |
| | Submissions | Toasts confirm saves, closes and sign-in. The report form ends with a full confirmation screen. `report-form.tsx`, `owner-actions.tsx` |
| | Uploads | Each photo shows a live progress bar (XHR progress events), then a preview, or a plain-language error. `photo-uploader.tsx` |
| | Chat | "Assistant is typing…" indicator; error card with Try again. `src/components/chat/chat-widget.tsx` |
| | Loading | Skeleton screens for browse and item pages. `src/app/browse/loading.tsx`, `src/app/items/[id]/loading.tsx` |
| **Affordances** | Buttons and fields | Buttons are filled or outlined with hover and press states and a pointer cursor. Inputs have a visible border and a white field on a warm background. `src/components/ui/button.tsx`, `input.tsx`, `globals.css` |
| | Cards | Whole listing cards are clickable (stretched link) and lift on hover. `item-card.tsx` |
| | Photo drop zone | Dashed "Choose or drop photos" area with a camera icon. `photo-uploader.tsx` |
| **Mapping** | Filters | The filter panel sits directly beside the results it controls (left column on desktop, a sheet on mobile). `browse/page.tsx` |
| | Forms | Each label, hint and error is attached to its own field (`aria-describedby`). `src/components/form/field.tsx` |
| | Owner actions | Edit, close, reunite and delete sit next to the report they act on. `report-list.tsx`, item page action panel |
| **Constraints** | Validation | Zod schemas on client and server: required fields, length limits, no future dates, no phone or email in public text. `src/lib/validation.ts` |
| | Disabled states | Continue is disabled while photos upload. Submit is disabled while saving. "Save name" is disabled until the name changes. The photo picker is disabled at 3 photos. |
| | Uploads | Only JPG, PNG and WebP up to 5 MB, checked by file signature on the server. `src/lib/image-processing.ts` |
| | Permissions | Only owners or moderators can edit or delete. Checked on the server in every action. `src/lib/items/actions.ts`, `src/lib/admin/actions.ts` |
| | Date input | `max=today` on date pickers. |
| **Consistency** | Design tokens | One primary colour, shared radius, spacing and typography tokens. `src/app/globals.css` |
| | Components | The same Button, Field, badge, EmptyState and PageHeader components are used everywhere. |
| | Lost/Found language | Lost always uses the search icon in the lost colour; Found always uses the hand icon in the found colour. |

## 2. Nielsen's ten usability heuristics

| # | Heuristic | Implementation |
|---|---|---|
| 1 | Visibility of system status | Status badges, upload progress, typing indicator, skeleton loaders, result counts, unread-activity counter on the account menu, "Saving…/Sending…" button labels. |
| 2 | Match with the real world | Plain terms: "Lost", "Found", "Date lost", "General location", "Reunited", "Claim in progress". Status meanings are written in everyday language. `src/lib/constants.ts` |
| 3 | User control and freedom | Undo after closing or reopening a report (toast action). Cancel and Back on every form step. Every filter is removable, plus "Clear all". Withdraw request. "Show original" after translating. Close or Esc for chat. "Start over" for restored drafts. |
| 4 | Consistency and standards | Standard web conventions: logo links home, search with a magnifier icon, account menu on the top right, breadcrumbs, native selects and date pickers. |
| 5 | Error prevention | Inline validation, a review step before submitting, confirmation dialogs for delete, decline and withdraw. Phone and email detection in public text. Private verification field for found items. |
| 6 | Recognition rather than recall | Category tiles with icons, location suggestions (datalist), visible filter chips, review step summary, restored drafts, a chat that suggests questions. |
| 7 | Flexibility and efficiency | Press **/** to jump to search, Enter to send in chat, URL-based filters (shareable, bookmarkable), auto-submitting sort, drafts saved automatically. |
| 8 | Aesthetic and minimalist design | Calm palette, generous whitespace, cards used only for scannable listings. Secondary filters are hidden under "More filters". |
| 9 | Recognise, diagnose, recover from errors | Error summary at the top of each form step with links to fields. Messages say what to do ("Please remove phone numbers… people will contact you privately"). Friendly 404 and error pages with next steps. Chat Try again. |
| 10 | Help and documentation | Global "Need help?" chatbot on every page, a Help page grouped by topic, a home-page FAQ, and hints under every form field. |

## 3. Shneiderman's eight golden rules

| Rule | Implementation |
|---|---|
| 1. Strive for consistency | Shared components and tokens; identical card layout everywhere; same action wording ("Report lost item", "Report found item"). |
| 2. Enable shortcuts for frequent users | "/" focuses search; Enter submits chat; URL filters can be bookmarked; the dashboard summary cards link straight to filtered lists. Shortcut hints are shown (the `/` key badge), so new users aren't confused. |
| 3. Offer informative feedback | Toasts include the new status ("Status: Closed"); upload progress percentages; "Request sent to Sam… usually within a day or two". |
| 4. Design dialogs to yield closure | The report wizard ends with a confirmation listing "what happens next". The claim form ends with "Request sent" and a link to the conversation. |
| 5. Prevent errors, simple error handling | Validation before submission; step-by-step checks; server re-validation; recoverable messages that keep entered values. |
| 6. Permit easy reversal | Undo for close and reopen; reopen any closed report; withdraw a request; edit any report; discard a draft; "Show original" language. |
| 7. Support internal locus of control | Users choose the handover method, whether to share contact details, and whether to accept a claim. No automatic actions on their behalf; the chatbot never submits anything. |
| 8. Reduce short-term memory load | The review step repeats everything entered. Progress shows the current step. Filters are visible as chips. The claim page shows the claimant's answer next to the finder's private note for direct comparison. |

## 4. Miller's Law

- The report form is split into **4 short steps** of 2–4 fields each rather than one long page (`report-form.tsx`).
- The home page shows **8 popular categories**, ordered by activity, with a link to all 12 (`src/app/page.tsx`).
- The Help page groups 16 questions into **4 labelled groups** (`src/app/help/page.tsx`).
- The dashboard summarises with **4 counters** and a short "Needs your reply" list.
- We use task context, not a rigid "7 ± 2" limit. For example, all 12 categories appear as tiles in the form, because users must choose one there.

## 5. Fitts's Law

- Default buttons are **40 px** tall, primary and large buttons **48 px**, inputs **44 px** (`src/components/ui/button.tsx`, `input.tsx`).
- The hero's Report Lost and Report Found are **80 px-tall** full-width cards on mobile (E2E asserts ≥ 64 px).
- Listing cards are a single large click target.
- The chat launcher is a **56 px** pill fixed in the bottom-right corner, away from content (E2E checks it doesn't overlap the hero actions).
- Primary submit buttons are full-width on mobile, with spacing (`gap-2`/`gap-3`) to prevent accidental taps.

## 6. Hick-Hyman Law

- Two clear first choices on the home page: **Lost** or **Found**.
- The header shows only five controls. Lost and Found are grouped under one "Report item" menu, so people scan fewer options on every page.
- Browse shows only the two most-used filters (type and category) by default. Location, date and status sit behind **"More filters"** (opened automatically if any is active).
- Sensible defaults: today's date, "Private messages on Homeward" contact method, "Active" status, "Newest first" sort, and "Best match" when searching.
- The chat offers 4 suggested questions instead of a blank box.

## 7. Power Law of Practice

- Every flow uses the same pattern (field + hint + error, primary button at bottom right, Back at bottom left), so speed improves with repetition.
- Drafts autosave. Filters persist in the URL. Chat history persists for the browser tab.
- Location suggestions and category icons become quicker to recognise over time.
- Shortcuts are optional and shown subtly, so they don't burden first-time users.

## 8. Pareto Principle

The core features were built first and are covered by end-to-end tests: **search, report lost, report found, item details and safe contact**. Secondary features (moderation, activity feed, translation, chatbot) build on the same components. We don't claim a measured 80/20 split; the principle guided prioritisation only.

## 9. General usability and accessibility

- Semantic landmarks (`header`, `nav`, `main`, `aside`, `footer`) and a **Skip to main content** link.
- A visible 3 px focus ring on every interactive element (`globals.css`).
- Status is never shown by colour alone: badges combine **text + icon + colour**, and include screen-reader text ("Status: Open").
- Form errors use `aria-invalid`, `aria-describedby` and `role="alert"` summaries.
- Chat uses `role="log"` with `aria-live="polite"`, labelled controls, Esc to close, and focus returning to the launcher.
- `prefers-reduced-motion` disables animations.
- Images have alt text ("Photo of …"). Placeholders show the category icon and name.
- Layouts are mobile-first. E2E checks there's no horizontal overflow at 412 px width.
- Language: the official Google Website Translator renders a native, keyboard-accessible `<select>`, labelled "Translate this page". User-written text shows "Machine-translated by Google" when the page is translated (`src/components/translate/`).
