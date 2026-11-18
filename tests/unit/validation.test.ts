import { describe, expect, it } from "vitest";
import {
  chatRequestSchema,
  containsContactDetails,
  reportFormSchema,
  searchFiltersSchema,
  signUpSchema,
} from "@/lib/validation";

const validReport = {
  reportType: "FOUND",
  title: "  Blue   water bottle ",
  categoryId: "3",
  description: "Found on a bench near the library entrance.",
  eventDate: new Date().toISOString().slice(0, 10),
  generalLocation: "Main Library",
  contactPreference: "IN_APP",
  imageIds: [],
};

describe("reportFormSchema", () => {
  it("accepts a valid report and normalises whitespace", () => {
    const result = reportFormSchema.safeParse(validReport);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Blue water bottle");
      expect(result.data.categoryId).toBe(3);
    }
  });

  it("rejects future dates with a plain-language message", () => {
    const tomorrow = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const result = reportFormSchema.safeParse({ ...validReport, eventDate: tomorrow });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/future/);
  });

  it("requires a category and a long enough description", () => {
    const result = reportFormSchema.safeParse({ ...validReport, categoryId: undefined, description: "short" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toContain("categoryId");
    expect(paths).toContain("description");
  });

  it("blocks phone numbers and emails in public fields", () => {
    const result = reportFormSchema.safeParse({
      ...validReport,
      description: "Call me on +44 7700 900123 if it is yours please",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/phone numbers or email/);
  });

  it("strips control characters", () => {
    const result = reportFormSchema.safeParse({ ...validReport, title: "Keys\u0000\u0007 ring" });
    expect(result.success && result.data.title).toBe("Keys ring");
  });

  it("rejects an unknown report type", () => {
    expect(reportFormSchema.safeParse({ ...validReport, reportType: "STOLEN" }).success).toBe(false);
  });
});

describe("containsContactDetails", () => {
  it.each([
    ["email me at jo@example.com", true],
    ["07700 900123", true],
    ["Room 101, 2nd floor", false],
    ["iPhone 14 in a clear case", false],
  ])("%s → %s", (input, expected) => {
    expect(containsContactDetails(input)).toBe(expected);
  });
});

describe("searchFiltersSchema", () => {
  it("drops invalid values instead of failing the whole page", () => {
    const parsed = searchFiltersSchema.parse({ type: "WHATEVER", category: "../etc", page: "-4", q: "wallet" });
    expect(parsed).toEqual({ q: "wallet", type: undefined, category: undefined, page: undefined });
  });
});

describe("signUpSchema", () => {
  it("requires matching passwords of at least 8 characters", () => {
    const result = signUpSchema.safeParse({ name: "Al", email: "a@b.co", password: "short", confirmPassword: "other" });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["password", "confirmPassword"]));
  });
});

describe("chatRequestSchema", () => {
  it("requires the final message to come from the user", () => {
    expect(
      chatRequestSchema.safeParse({ messages: [{ role: "assistant", content: "hi" }] }).success,
    ).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "hi" }] }).success).toBe(true);
  });

  it("limits message length", () => {
    expect(
      chatRequestSchema.safeParse({ messages: [{ role: "user", content: "x".repeat(1001) }] }).success,
    ).toBe(false);
  });
});
