import { expect, test } from "@playwright/test";
import { ALEX, MODERATOR, SAM, go, openListing, signIn, signOut } from "./helpers";

test.describe("Safe contact (claim) flow", () => {
  test("claimant sends a request; finder accepts and they message privately", async ({ page }) => {
    await signIn(page, ALEX.email);
    await openListing(page, "Blue Hydro Flask water bottle", "Hydro Flask");

    // Validation: the identifying detail is required for found items.
    await page.locator("#claim-message").fill("I think this is mine, I lost it at lunch on Monday.");
    await page.getByRole("button", { name: "Send claim request" }).click();
    await expect(page.getByText("Describe something only the owner would know")).toBeVisible();

    await page.locator("#claim-answer").fill("Stickers of a cat and a mountain on the side.");
    await page.getByRole("button", { name: "Send claim request" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Request sent to Sam" })).toBeVisible();

    await signOut(page);
    await signIn(page, SAM.email, "/dashboard/requests");
    await page.getByRole("link", { name: /Blue Hydro Flask water bottle/ }).first().click();
    await expect(page.getByText("Stickers of a cat and a mountain on the side.")).toBeVisible();
    await page.getByRole("button", { name: "Accept and start conversation" }).click();
    await expect(page.getByText(/Accepted\. Alex can now message you/)).toBeVisible();
    await page.locator("#message-body").fill("Great! Meet at the Student Union desk at 2pm?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("list", { name: "Messages" })).toContainText("Meet at the Student Union desk");

    // The listing now shows "Claim in progress".
    await openListing(page, "Blue Hydro Flask water bottle", "Hydro Flask");
    await expect(page.getByText("Status: Claim in progress").first()).toBeAttached();
  });

  test("a third person cannot open someone else's conversation", async ({ page }) => {
    await signIn(page, SAM.email, "/dashboard/requests");
    const href = await page.getByRole("link", { name: /Brown leather wallet/ }).first().getAttribute("href");
    // A brand-new user, unrelated to the conversation, must not be able to read it.
    await signOut(page);
    await go(page, "/sign-up");
    await page.locator("#auth-name").fill("Outsider Person");
    await page.locator("#auth-email").fill(`outsider-${Date.now()}@example.test`);
    await page.locator("#auth-password").fill("strong-pass-1");
    await page.locator("#auth-confirmPassword").fill("strong-pass-1");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await go(page, href!);
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });
});

test.describe("Moderation", () => {
  test("users can flag a listing and moderators can hide it", async ({ page }) => {
    await signIn(page, ALEX.email);
    await openListing(page, "Gold hoop earring", "earring");
    await page.getByRole("button", { name: "Report listing" }).click();
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByRole("dialog").getByRole("alert")).toHaveText("Choose a reason.");
    await page.getByText("Duplicate of another listing").click();
    await page.getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("You reported this listing.")).toBeVisible();

    // Regular users are kept out of the moderation area.
    await go(page, "/admin");
    await expect(page.getByText("only available to moderators")).toBeVisible();

    await signOut(page);
    await signIn(page, MODERATOR.email, "/admin");
    const row = page.getByRole("row").filter({ hasText: "Gold hoop earring" }).first();
    await row.getByRole("button", { name: "Moderate" }).click();
    await page.locator("#mod-reason").fill("Hidden while we check a duplicate report.");
    await page.getByRole("button", { name: "Apply action" }).click();
    await expect(page.getByText(/Hidden from public: “Gold hoop earring”/)).toBeVisible();

    await signOut(page);
    await go(page, "/browse?q=earring&status=all");
    await expect(page.getByRole("heading", { name: "Nothing matches yet" })).toBeVisible();
  });
});

test.describe("Help chatbot", () => {
  test("opens, answers from the FAQ, checks real listings, handles errors and closes", async ({ page }) => {
    await go(page, "/browse");
    const launcher = page.getByRole("button", { name: "Need help?" });
    await launcher.click();
    const dialog = page.getByRole("dialog", { name: "Homeward help" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Ask a question" })).toBeFocused();

    await dialog.getByRole("textbox", { name: "Ask a question" }).fill("What do the statuses mean?");
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("log")).toContainText("Claim in progress");

    await dialog.getByRole("textbox", { name: "Ask a question" }).fill("I lost my wallet");
    await dialog.getByRole("button", { name: "Send message" }).click();
    await expect(dialog.getByRole("log")).toContainText("I checked the database");
    await expect(dialog.getByRole("link", { name: /Brown leather wallet/ })).toBeVisible();

    // Error handling with a retry.
    await page.route("**/api/chat", (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: "Something went wrong on our side. Please try again." }) }));
    await dialog.getByRole("textbox", { name: "Ask a question" }).fill("How do I report a found item?");
    await page.keyboard.press("Enter");
    await expect(dialog.getByRole("alert")).toContainText("Message not sent");
    await page.unroute("**/api/chat");
    await dialog.getByRole("button", { name: "Try again" }).click();
    await expect(dialog.getByRole("log")).toContainText("Report Found Item");

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(launcher).toBeFocused();
  });
});
