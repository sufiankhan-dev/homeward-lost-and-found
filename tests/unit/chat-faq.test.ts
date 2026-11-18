import { describe, expect, it } from "vitest";
import { detectSearchIntent, faqReply, matchFaq, UNKNOWN_REPLY } from "@/lib/chat/faq-engine";

describe("matchFaq", () => {
  it.each([
    ["How do I report a lost item?", "report-lost"],
    ["I found a wallet, what should I do", "report-found"],
    ["what does claim in progress mean", "statuses"],
    ["how can I contact the finder?", "claim"],
    ["can I upload a photo", "photos"],
    ["how do I delete my report", "manage"],
    ["is my phone number safe", "privacy"],
  ])("%s → %s", (question, id) => {
    expect(matchFaq(question)?.entry.id).toBe(id);
  });
});

describe("faqReply", () => {
  it("admits when it doesn't know instead of guessing", () => {
    expect(faqReply("What's the weather on Mars?")).toEqual(UNKNOWN_REPLY);
  });

  it("returns links to relevant pages", () => {
    const reply = faqReply("How do I report a lost item?");
    expect(reply.links.map((l) => l.href)).toContain("/report/lost");
  });

  it("never includes email addresses in answers", () => {
    for (const q of ["contact", "privacy", "help", "report found"]) {
      expect(faqReply(q).reply).not.toMatch(/@/);
    }
  });
});

describe("detectSearchIntent", () => {
  it("turns a lost message into a search of found reports", () => {
    expect(detectSearchIntent("I lost my black wallet near the library")).toEqual({
      query: "black wallet library",
      lookFor: "FOUND",
      userSituation: "lost",
    });
  });

  it("turns a found message into a search of lost reports", () => {
    expect(detectSearchIntent("I found a blue water bottle")).toMatchObject({ lookFor: "LOST", query: "blue water bottle" });
  });

  it("ignores general questions", () => {
    expect(detectSearchIntent("How do statuses work?")).toBeNull();
    expect(detectSearchIntent("I lost it")).toBeNull();
  });
});
