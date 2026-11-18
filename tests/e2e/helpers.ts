import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "homeward-demo-1";
export const ALEX = { email: "alex@demo.homeward.test", name: "Alex Morgan" };
export const SAM = { email: "sam@demo.homeward.test", name: "Sam Rivera" };
export const MODERATOR = { email: "moderator@demo.homeward.test", name: "Jordan Lee (Moderator)" };

/** Navigate and wait until React has hydrated (forms are interactive). */
export async function go(page: Page, url: string) {
  await page.goto(url);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

export async function signIn(page: Page, email: string, next = "/dashboard") {
  await go(page, `/sign-in?next=${encodeURIComponent(next)}`);
  await page.locator("#auth-email").fill(email);
  await page.locator("#auth-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

export async function signOut(page: Page) {
  await page.context().clearCookies();
}

/** Opens a listing by its title from the browse page. */
export async function openListing(page: Page, title: string, query = title) {
  await go(page, `/browse?q=${encodeURIComponent(query)}&status=all`);
  await page.getByRole("link", { name: new RegExp(title, "i") }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(title, "i") })).toBeVisible();
  await page.waitForLoadState("networkidle");
}
