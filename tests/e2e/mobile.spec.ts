import { expect, test } from "@playwright/test";
import { go } from "./helpers";

test.describe("Small screens", () => {
  test("layout has no horizontal scroll and primary actions are reachable", async ({ page }) => {
    for (const path of ["/", "/browse", "/help", "/sign-in"]) {
      await go(page, path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
    }
    await go(page, "/");
    await expect(page.getByRole("link", { name: /Report Lost Item/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Report Found Item/ })).toBeVisible();
  });

  test("mobile menu opens and closes with the primary actions", async ({ page }) => {
    await go(page, "/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const sheet = page.getByRole("dialog", { name: "Menu" });
    await expect(sheet.getByRole("link", { name: "Report lost item" })).toBeVisible();
    await sheet.getByRole("link", { name: "Browse items" }).click();
    await expect(page).toHaveURL(/\/browse/);
    await expect(sheet).toHaveCount(0);
  });

  test("filters open in a sheet on mobile", async ({ page }) => {
    await go(page, "/browse");
    await page.getByRole("button", { name: /Filters/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filter listings" });
    await sheet.getByLabel("Category").selectOption("keys");
    await sheet.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/category=keys/);
  });

  test("language selector is labelled, keyboard reachable and does not cover content", async ({ page }) => {
    await go(page, "/");
    const label = page.locator('label[for="site-language"]');
    await expect(label).toBeAttached();
    // The official Google widget needs network access; accept either the
    // loaded native select or the clear "unavailable" message.
    const select = page.locator("#site-language");
    const unavailable = page.getByText("Translation unavailable right now");
    await expect(select.or(unavailable)).toBeVisible({ timeout: 15_000 });
    if (await select.isVisible()) {
      await expect(select).toHaveAttribute("aria-label", "Translate this page");
      await select.focus();
      await expect(select).toBeFocused();
      const box = await select.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(64); // stays inside the header
    }
    // The chat launcher stays clear of the hero actions.
    const launcher = await page.getByRole("button", { name: "Need help?" }).boundingBox();
    const lost = await page.getByRole("link", { name: /Report Lost Item/ }).boundingBox();
    expect(launcher!.y).toBeGreaterThan(lost!.y + lost!.height);
  });
});
