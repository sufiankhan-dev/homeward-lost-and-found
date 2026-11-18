import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Privacy & safety" };

const SECTIONS = [
  {
    title: "What other people can see",
    points: [
      "Listings show the item, category, general location, date, photos and the reporter's first name.",
      "Your email address, phone number, student ID and surname are never shown on listings.",
      "Private verification details on found items are visible only to the person who found the item.",
    ],
  },
  {
    title: "How contact works",
    points: [
      "Requests and messages stay inside Homeward between the two people involved.",
      "You decide whether to share any contact details in a conversation. You never have to.",
      "Listing text that looks like a phone number or email address is blocked when you submit.",
    ],
  },
  {
    title: "Photos",
    points: [
      "Photos are re-saved by Homeward, which removes hidden metadata such as GPS location.",
      "Avoid photographing card numbers, names or documents in a way that can be read.",
    ],
  },
  {
    title: "Safe handovers",
    points: [
      "Meet in a busy public place on campus during the day, or use the Lost & Found desk.",
      "Ask the claimant to describe a private detail before handing anything over.",
      "Never pay money to get an item back, and never send money to someone you met here.",
    ],
  },
  {
    title: "Reporting problems",
    points: [
      "Use Report listing on any listing that looks like spam, a duplicate, or shows personal information.",
      "Moderators can hide, close or merge listings, and every action is recorded with a reason.",
    ],
  },
  {
    title: "Translation",
    points: [
      "The language selector uses Google Translate. When you use it, page text is sent to Google for translation.",
      "Machine translations can be inaccurate. Text written by other users is marked when translated.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader title="Privacy & safety" description="How Homeward protects your information, and how to stay safe when returning items." />
      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-2xl border bg-card p-5">
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
