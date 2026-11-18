# AGENTS.md

## Project: Lost and Found Platform

Build a usable, accessible, responsive Lost and Found website for a university or community. The platform helps people report lost items, report found items, search listings, and safely reconnect owners with their belongings.

This is an HCI project. The interface and user flows must demonstrate the design principles and usability laws listed below through actual interface decisions, not merely mention them in documentation.

## 1. Working rules for the AI agent

1. Inspect the existing repository before changing anything. Identify the framework, package manager, routes, components, styling system, database, authentication, and existing conventions.
2. Preserve working code and established project conventions. Do not replace the stack or rewrite the application without a clear technical reason.
3. If the repository is empty, use the default stack in Section 2.
4. Build the application in small, testable stages. After each major stage, run the relevant checks and fix errors before continuing.
5. Do not leave dead buttons, fake links, placeholder forms, or controls that look functional but do nothing.
6. Use realistic sample data only where a real backend is not yet available. Clearly separate demo data from production data.
7. Do not expose private contact details, authentication secrets, database credentials, or environment variables in client code.
8. Do not claim a feature is complete until its main user flow has been tested.
9. Keep the UI simple, calm, consistent, and easy to understand. Avoid unnecessary cards, gradients, animations, dialogs, and decorative elements.
10. Use clear names, reusable components, strict TypeScript types, and maintainable code. Avoid `any` unless there is a documented reason.
11. Do not install a dependency if the same requirement can be met cleanly with the existing stack.
12. Before finishing, provide a concise summary of completed work, important implementation decisions, environment variables required, and test results.

## 2. Suggested technical stack

Use the existing stack if the repository already has one. If starting from scratch, prefer:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui for accessible interface primitives
- Better Auth for authentication
- Neon PostgreSQL for the database
- Drizzle ORM for schema and queries
- Zod for input validation
- React Hook Form where forms benefit from it
- A suitable image storage provider for item photographs
- Vitest or the existing unit testing framework
- Playwright for important end to end user journeys

Keep database access on the server. Use server actions or route handlers consistently. Never connect to Neon directly from browser code.

## 3. Product goal and users

### Main user groups

- A person who has lost an item
- A person who has found an item
- A user who wants to browse recent reports
- An administrator or moderator who reviews reports and handles abuse

### Main user outcomes

A user should be able to:

1. Understand what the platform does immediately.
2. Search for an item without creating an account.
3. Filter listings by category, date, location, and status.
4. Submit a lost item report.
5. Submit a found item report.
6. View useful details and photographs of a listing.
7. Contact the reporter through a safe, platform controlled process.
8. Track their own submitted reports.
9. Edit or close their own reports.
10. Get help using the chatbot and language translation.

### Important safety and privacy requirements

- Do not display a reporter's personal phone number, email, home address, student ID, or other sensitive details publicly.
- Use an in platform contact or claim request flow where possible.
- Do not reveal every identifying detail of a found item. Keep one or more details private so a claimant can verify ownership.
- Include moderation controls for suspicious, duplicate, misleading, or inappropriate listings.
- Validate and sanitize user input on the server.
- Restrict edit and delete operations to the owner of the report or an authorized administrator.
- Add reasonable upload type and size limits. Do not trust file extensions alone.
- Make the distinction between a lost report and a found report obvious.

## 4. Core pages and features

### Home page

Include:

- Clear heading explaining the service
- Two prominent actions: **Report Lost Item** and **Report Found Item**
- Search field with a clear search action
- Recently reported items
- Categories or quick filters
- Simple explanation of how the process works
- Google Translate language selector or translation integration
- Persistent chatbot entry point
- Footer with help, privacy, and contact links

Do not overcrowd the home page. The primary actions and search must be immediately visible.

### Browse and search

- Search by item name, description, or relevant keyword.
- Filters for lost/found, category, date range, location, and status.
- Sort by newest and relevance where supported.
- Provide clear empty, loading, and error states.
- Keep selected filters visible and easy to remove.
- Use pagination or a deliberate load more pattern.

### Report an item

Use a guided form with separate Lost and Found modes.

Suggested fields:

- Item title
- Item category
- Description
- Date lost or found
- General location
- Optional photo
- Additional identifying details, with a warning not to publish secret verification details
- Preferred safe contact method

Requirements:

- Explain why each important field is requested.
- Mark required and optional fields clearly.
- Validate inline and summarize errors accessibly.
- Preserve entered values when validation fails.
- Show a review step before final submission if it improves confidence.
- Confirm successful submission and explain what happens next.

### Item details

Show the information needed to identify and understand the listing without exposing private details. Include a clear contact or claim action, listing status, report date, and relevant category and location information.

### Authentication and user dashboard

- Sign up, sign in, and sign out
- Protected dashboard
- List the user's own reports
- Edit, close, or delete permitted reports
- Show report status and claim request updates
- Include useful empty states

### Admin and moderation

If time and project scope allow, provide a protected admin area to review reports, remove inappropriate content, resolve duplicates, and manage report status. Verify authorization on the server, not only by hiding UI controls.

### Global chatbot

Provide a chatbot entry point that is available across the website.

The chatbot should:

- Explain how to use the platform.
- Guide users through reporting a lost or found item.
- Explain search filters and report statuses.
- Answer common questions using approved platform information.
- Offer links to relevant pages or actions.
- Clearly say when it does not know an answer.
- Never invent listings, claim that a match exists without checking the database, or disclose private user information.
- Avoid pretending to submit a report. If it cannot perform an action, guide the user to the correct form.
- Include keyboard accessible open, close, send, and message navigation controls.
- Show a visible typing or loading state and useful error feedback.
- Provide a clear way to close or minimize the chat.

If an AI service is unavailable, implement a useful FAQ or guided help fallback. Keep API keys on the server and validate messages.

### Google Translate

Add a language translation option on the home page, as requested. Make the language selector easy to find and understand.

- Prefer an officially supported Google Translate integration or an approved translation service.
- Do not build a fake language selector.
- If an official widget or API is unavailable, explain the limitation and implement a clean integration boundary rather than scraping or relying on undocumented endpoints.
- Keep the site's own interface language and user submitted listing content distinct. Translation of user generated content should be clearly indicated as a translation.
- Ensure the selector is keyboard accessible and does not cover important content on mobile.

## 5. HCI principles and laws: required implementation

The following principles must shape the actual interface. Add a short HCI implementation document or README section explaining where each principle appears in the product.

### Don Norman's six design principles

1. **Visibility:** Make available actions, report status, filters, and system state visible.
2. **Feedback:** Confirm searches, submissions, uploads, chat messages, and status changes. Show progress for longer operations.
3. **Affordances:** Make buttons look clickable, text fields look editable, and navigation elements recognizable.
4. **Mapping:** Place controls next to the content they affect. For example, filters should be near search results and form labels should sit with their fields.
5. **Constraints:** Prevent invalid actions through validation, disabled unavailable actions, allowed file types, and permission checks.
6. **Consistency:** Reuse the same colors, labels, spacing, icons, button styles, and interaction patterns across the application.

### Nielsen's ten usability heuristics

1. Visibility of system status: show loading, success, error, and current report status.
2. Match between system and real world: use familiar language such as Lost Item, Found Item, Date, and Location.
3. User control and freedom: allow users to cancel, go back, clear filters, and correct form entries.
4. Consistency and standards: use familiar web conventions and consistent components.
5. Error prevention: validate inputs and confirm destructive actions.
6. Recognition rather than recall: show labels, hints, selected filters, and recent context instead of making users remember information.
7. Flexibility and efficiency: provide useful defaults, search, filters, and shortcuts without making the interface confusing for new users.
8. Aesthetic and minimalist design: show only information needed for the current task.
9. Help users recognize, diagnose, and recover from errors: use plain language and explain how to fix errors.
10. Help and documentation: provide clear help content and the global chatbot.

### Shneiderman's eight golden rules

1. Strive for consistency.
2. Enable frequent users to use shortcuts where appropriate.
3. Offer informative feedback.
4. Design dialogs to yield closure.
5. Prevent errors and provide simple error handling.
6. Permit easy reversal of actions.
7. Support an internal locus of control by making users feel in control.
8. Reduce short term memory load.

Apply these rules to navigation, forms, search, confirmation messages, editing, and moderation flows.

### Miller's Law

Avoid overwhelming users with too many choices or too much information at once. Group related categories, use progressive disclosure for optional fields, and break long forms into clear sections. Do not treat seven items as a rigid universal limit. Use task context and usability testing to decide how much information to show.

### Fitts's Law

Make primary actions easy to reach and large enough to select. Provide comfortable touch targets, especially for Report Lost, Report Found, Search, Submit, and chatbot controls. Place important actions where users can find them without precise pointer movement. Ensure spacing prevents accidental taps.

### Hick-Hyman Law

Reduce unnecessary choices and decision time. Use clear categories, sensible defaults, grouped options, and progressive disclosure. Avoid presenting every filter or action at once when it is not needed.

### Power Law of Practice

Make repeated tasks more efficient and predictable. Keep interaction patterns consistent, preserve useful preferences where appropriate, and make frequent actions such as searching and submitting a report straightforward. Do not add shortcuts that confuse first time users.

### Pareto Principle

Prioritize the small set of features that delivers most user value: search, report lost, report found, item details, and safe contact. Make these flows reliable before adding secondary features. Do not use the 80/20 ratio as a claim about measured user behavior unless actual project data supports it.

### General usability and accessibility

- Use semantic HTML and accessible labels.
- Support keyboard navigation and visible focus states.
- Maintain readable contrast and legible typography.
- Do not communicate status through color alone.
- Provide meaningful alternative text for informative images.
- Respect reduced motion preferences.
- Use responsive layouts for mobile, tablet, and desktop.
- Ensure forms work with screen readers.
- Use plain, concise language and explain unfamiliar terms.

## 6. Visual design direction

Aim for a calm, trustworthy, welcoming interface.

- Use a restrained color palette with one clear primary color and neutral backgrounds.
- Use consistent spacing, typography, border radius, and elevation.
- Avoid excessive shadows, glass effects, gradients, and decorative animation.
- Prefer clear hierarchy and whitespace over dense layouts.
- Use cards only when they help users compare or scan listings.
- Item images should have consistent aspect ratios and sensible fallbacks.
- Make lost and found states distinguishable with text labels and accessible visual treatment.
- Design mobile first, then adapt for larger screens.
- Add subtle motion only when it communicates state or improves orientation.

Before inventing a design system, inspect the current application and reuse existing tokens and components.

## 7. Data model guidance

Design a normalized schema appropriate to the selected ORM. At minimum consider:

### User
- id
- name
- email
- authentication fields managed by Better Auth
- createdAt
- updatedAt

### ItemReport
- id
- userId
- reportType: LOST or FOUND
- title
- description
- categoryId
- generalLocation
- eventDate
- image references
- status: OPEN, PENDING, RESOLVED, or CLOSED
- createdAt
- updatedAt

### Category
- id
- name
- slug

### ClaimRequest or ContactRequest
- id
- itemReportId
- requesterUserId
- message
- status
- createdAt
- updatedAt

### ModerationRecord
- id
- itemReportId
- moderatorUserId
- action
- reason
- createdAt

Adjust this model to avoid unnecessary complexity. Add indexes for common search and filter fields. Use foreign keys and appropriate deletion behavior. Store image metadata and storage keys rather than large image blobs in PostgreSQL.

## 8. Security and validation

- Validate all inputs on the server with schemas.
- Enforce authentication and authorization on every protected operation.
- Do not rely on client side checks for security.
- Use parameterized ORM queries.
- Protect against cross site scripting by rendering user content safely.
- Apply rate limits to authentication, report creation, contact requests, and chatbot endpoints where feasible.
- Restrict image upload MIME types, file size, and dimensions.
- Avoid exposing internal errors or stack traces to users.
- Keep secrets in environment variables and provide an `.env.example` with placeholder values only.
- Do not commit real credentials.

## 9. Testing requirements

Test at least these journeys:

1. Visitor opens the home page and understands the two main actions.
2. Visitor searches and filters listings.
3. Visitor opens an item detail page.
4. A user signs up and signs in.
5. Authenticated user submits a lost report.
6. Authenticated user submits a found report.
7. User edits or closes their own report.
8. A different user cannot edit or delete another user's report.
9. Invalid forms show clear, recoverable errors.
10. Chatbot opens, sends a message, handles an error, and closes.
11. Language selector is usable by keyboard and on mobile.
12. Layout remains usable on small screens.
13. Empty, loading, and error states render correctly.

Run the project's lint, type check, unit tests, and production build. Add end to end tests for the most important flows. Fix failures rather than hiding or skipping them.

## 10. Performance and reliability

- Use server components by default where appropriate.
- Keep client components limited to interactive areas.
- Optimize images and lazy load below the fold.
- Avoid unnecessary client side data fetching.
- Add database indexes for actual query patterns.
- Handle empty, slow, and failed network responses.
- Avoid excessive animation and large dependencies.
- Ensure search and listing pages remain responsive with realistic data volume.

## 11. Suggested implementation order

1. Inspect repository and report the current architecture.
2. Define user journeys and page structure.
3. Establish design tokens and reusable UI components.
4. Build responsive home page and browse/search experience using temporary data.
5. Design database schema and connect the database.
6. Implement authentication and authorization.
7. Implement lost and found report creation and management.
8. Implement item detail and safe contact or claim request flow.
9. Add Google Translate integration.
10. Add the global chatbot and fallback help experience.
11. Add moderation features if in scope.
12. Add tests, accessibility checks, and responsive refinements.
13. Run lint, type check, tests, and production build.
14. Write setup instructions and the HCI principles mapping.

Do not start all tasks at once. Complete and verify each stage before moving to the next.

## 12. Definition of done

The project is ready for demonstration when:

- The main lost and found journeys work end to end.
- Search and filters return correct results.
- Authentication and ownership permissions are enforced.
- No private contact information is exposed publicly.
- Home page translation control is real and usable, or its integration limitation is clearly documented with a working alternative.
- Chatbot is available across the site and has a useful fallback.
- The interface works on mobile and desktop.
- The listed HCI principles and laws are mapped to concrete interface decisions.
- Important flows have automated tests.
- Lint, type check, tests, and production build pass.
- README explains setup, environment variables, features, and HCI implementation.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
