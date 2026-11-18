import path from "node:path";
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { ALEX, SAM, go, openListing, signIn } from "./helpers";

const fixtureDir = path.resolve("test-results/fixtures");
const photoPath = path.join(fixtureDir, "bottle.png");

test.beforeAll(async () => {
  mkdirSync(fixtureDir, { recursive: true });
  await sharp({ create: { width: 400, height: 300, channels: 3, background: { r: 40, g: 90, b: 160 } } })
    .png()
    .toFile(photoPath);
});

async function continueStep(page: Page) {
  await page.getByRole("button", { name: "Continue" }).click();
}

test.describe("Authentication", () => {
  test("a new user can sign up, sign out and sign back in", async ({ page }) => {
    const email = `new-${Date.now()}@example.test`;
    await go(page, "/sign-up");
    // Inline validation first.
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Name needs at least 2 characters.")).toBeVisible();

    await page.locator("#auth-name").fill("Riley Chen");
    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill("strong-pass-1");
    await page.locator("#auth-confirmPassword").fill("strong-pass-1");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Welcome back, Riley" })).toBeVisible();
    await expect(page.getByText("You haven't reported anything yet")).toBeVisible();

    await page.getByRole("button", { name: /Account menu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    await go(page, "/sign-in");
    await page.locator("#auth-email").fill(email);
    await page.locator("#auth-password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText(/don't match an account/)).toBeVisible();
    await page.locator("#auth-password").fill("strong-pass-1");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("Reporting", () => {
  test("submit a lost report with recoverable validation errors and a photo", async ({ page }) => {
    await signIn(page, ALEX.email, "/report/lost");
    await expect(page.getByRole("heading", { name: "Report a lost item" })).toBeVisible();

    // Invalid step: errors are summarised and linked to fields.
    await page.locator("#title").fill("ab");
    await continueStep(page);
    const summary = page.getByRole("alert").filter({ hasText: "Please fix the following" });
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Item name");
    await expect(summary).toContainText("Category");

    // Fix the errors; entered values are preserved.
    await page.locator("#title").fill("Silver bicycle lock key");
    await page.getByText("Keys", { exact: true }).click();
    await page.locator("#description").fill("Small silver key for a Kryptonite bike lock on a green ring.");
    await continueStep(page);

    await expect(page.getByRole("heading", { name: /When and where/ })).toBeVisible();
    await page.locator("#generalLocation").fill("Engineering Block");
    await continueStep(page);

    await expect(page.getByRole("heading", { name: /Photos and details/ })).toBeVisible();
    await page.locator("#photo-input").setInputFiles(photoPath);
    await expect(page.getByRole("img", { name: "Photo 1" })).toBeVisible();
    await page.locator("#distinguishingFeatures").fill("Green key ring");
    await continueStep(page);

    await expect(page.getByRole("heading", { name: /Review and submit/ })).toBeVisible();
    await expect(page.getByText("Silver bicycle lock key")).toBeVisible();
    await expect(page.getByText("1 photo")).toBeVisible();
    await page.getByRole("button", { name: "Submit lost report" }).click();

    await expect(page.getByRole("heading", { name: "Your lost report is live" })).toBeVisible();
    await page.getByRole("link", { name: "View my report" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Silver bicycle lock key/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "This is your report" })).toBeVisible();
    await expect(page.locator('img[src^="/api/images/"]').first()).toBeVisible();
  });

  test("submit a found report; private details stay private", async ({ page, browser }) => {
    await signIn(page, SAM.email, "/report/found");
    await page.locator("#title").fill("Red scarf");
    await page.getByText("Clothing", { exact: true }).click();
    await page.locator("#description").fill("Knitted red scarf left on a chair in the Arts Building café.");
    await continueStep(page);
    await page.locator("#generalLocation").fill("Arts Building");
    await continueStep(page);
    await page.locator("#verificationDetails").fill("Tag inside says hand made by Nana");
    await page.getByText("Campus Lost & Found desk").click();
    await continueStep(page);
    await page.getByRole("button", { name: "Submit found report" }).click();
    await expect(page.getByRole("heading", { name: "Your found report is live" })).toBeVisible();
    await page.getByRole("link", { name: "View my report" }).click();
    await expect(page.getByText("Tag inside says hand made by Nana")).toBeVisible();
    const itemUrl = page.url();

    // Another visitor cannot see the private note.
    const visitor = await browser.newPage();
    await visitor.goto(itemUrl);
    await expect(visitor.getByRole("heading", { level: 1, name: /Red scarf/ })).toBeVisible();
    expect(await visitor.content()).not.toContain("hand made by Nana");
    await visitor.close();
  });

  test("owner can edit, close (with undo) and reopen their report", async ({ page }) => {
    await signIn(page, ALEX.email);
    await openListing(page, "Red umbrella", "umbrella");
    await page.getByRole("button", { name: "Reopen report" }).click();
    await expect(page.getByText("Report reopened.")).toBeVisible();
    await expect(page.getByText("Status: Open").first()).toBeAttached();

    await page.getByRole("button", { name: "Close report" }).click();
    await expect(page.getByText("Report closed.")).toBeVisible();
    await page.locator("[data-sonner-toast]").filter({ hasText: "Report closed" }).getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("Restored to “Open”.")).toBeVisible();

    await page.getByRole("link", { name: "Edit report" }).click();
    await expect(page.getByRole("heading", { name: "Edit report" })).toBeVisible();
    await page.locator("#title").fill("Red folding umbrella");
    await page.getByRole("button", { name: /Step 4: Review/ }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Red folding umbrella/ })).toBeVisible();
  });

  test("a different user cannot edit another user's report", async ({ page }) => {
    await signIn(page, ALEX.email);
    await openListing(page, "Brown leather wallet", "wallet");
    await expect(page.getByRole("link", { name: "Edit report" })).toHaveCount(0);
    const id = page.url().split("/items/")[1];
    await go(page, `/items/${id}/edit`);
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });
});
