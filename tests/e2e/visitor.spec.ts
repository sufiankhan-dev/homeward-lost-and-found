import { expect, test } from "@playwright/test";
import { go } from "./helpers";

test.describe("Visitor journeys", () => {
  test("home page explains the service and shows the two main actions", async ({ page }) => {
    await go(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Let's get it home");
    const lost = page.getByRole("link", { name: /Report Lost Item/ });
    const found = page.getByRole("link", { name: /Report Found Item/ });
    await expect(lost).toBeVisible();
    await expect(found).toBeVisible();
    // Fitts's law: primary actions are large targets.
    const box = await lost.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(64);
    await expect(page.getByRole("searchbox", { name: /Search lost and found items/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recently reported" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Popular categories" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Frequently asked questions" })).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Privacy & safety" })).toBeVisible();
  });

  test("search from the home page, then filter and clear filters", async ({ page }) => {
    await go(page, "/");
    await page.getByRole("searchbox", { name: /Search lost and found items/ }).fill("keys");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/browse\?q=keys/);
    await expect(page.getByRole("heading", { name: /Showing 1–\d+ of \d+ item/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Set of keys with red lanyard/ })).toBeVisible();

    // Filter to found items only via the filter panel.
    const filters = page.getByRole("complementary", { name: "Filters" });
    await filters.getByText("Found", { exact: true }).click();
    await filters.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/type=FOUND/);
    await expect(page.getByRole("link", { name: /Set of keys with red lanyard/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Car key with Toyota fob/ })).toHaveCount(0);

    // Active filters are visible and removable.
    const chip = page.getByRole("link", { name: /Found items \(remove filter\)/ });
    await expect(chip).toBeVisible();
    await page.getByRole("link", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/browse$/);
  });

  test("category, location and status filters return the right items", async ({ page }) => {
    await go(page, "/browse?category=keys&status=all");
    await expect(page.getByRole("link", { name: /Car key with Toyota fob/ })).toBeVisible();
    await go(page, "/browse?location=Sports");
    const titles = await page.getByRole("article").getByRole("heading").allInnerTexts();
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t).toMatch(/keys|watch/i);
  });

  test("empty search shows a helpful empty state", async ({ page }) => {
    await go(page, "/browse?q=zzzunicorn");
    await expect(page.getByRole("heading", { name: "Nothing matches yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear all filters" })).toBeVisible();
  });

  test("item detail shows details without private information", async ({ page }) => {
    await go(page, "/browse?q=wallet");
    await page.getByRole("link", { name: /Brown leather wallet/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: /Brown leather wallet/ })).toBeVisible();
    await expect(page.getByText("Main Library").first()).toBeVisible();
    await expect(page.getByText("Status: Open").first()).toBeAttached();
    await expect(page.getByRole("link", { name: /Sign in to contact/ })).toBeVisible();
    // Private verification details and emails are never shown publicly.
    const html = await page.content();
    expect(html).not.toContain("blue library card");
    expect(html).not.toContain("@demo.homeward.test");
  });

  test("unknown listing shows a not-found page", async ({ page }) => {
    await go(page, "/items/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });

  test("protected pages redirect to sign-in and back", async ({ page }) => {
    await go(page, "/report/lost");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Freport%2Flost/);
  });
});
