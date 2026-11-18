import { z } from "zod";
import {
  CONTACT_PREFERENCES,
  FLAG_REASONS,
  ITEM_STATUSES,
  REPORT_TYPES,
} from "./constants";

/** Collapse whitespace and strip control characters from free text. */
const cleanText = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

const text = (min: number, max: number, label: string) =>
  z
    .string({ error: `${label} is required.` })
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(min, {
          error:
            min <= 1
              ? `${label} is required.`
              : `${label} needs at least ${min} characters.`,
        })
        .max(max, { error: `${label} must be ${max} characters or fewer.` }),
    );

const optionalText = (max: number, label: string) =>
  z
    .string()
    .transform(cleanText)
    .pipe(
      z.string().max(max, { error: `${label} must be ${max} characters or fewer.` }),
    )
    .optional()
    .transform((v) => (v ? v : undefined));

/** Rough check for phone numbers / emails pasted into public fields. */
const CONTACT_PATTERN =
  /([\w.+-]+@[\w-]+\.[\w.]+)|(\+?\d[\d\s().-]{7,}\d)/;

export function containsContactDetails(value: string | undefined): boolean {
  return value ? CONTACT_PATTERN.test(value) : false;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export const isoDate = z
  .string({ error: "Date is required." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Enter a valid date." })
  .refine((v) => !Number.isNaN(Date.parse(v)), { error: "Enter a valid date." });

export const reportFormSchema = z
  .object({
    reportType: z.enum(REPORT_TYPES, { error: "Choose Lost or Found." }),
    title: text(3, 120, "Item name"),
    categoryId: z.coerce
      .number({ error: "Choose a category." })
      .int()
      .positive({ error: "Choose a category." }),
    description: text(10, 2000, "Description"),
    eventDate: isoDate
      .refine((v) => v <= todayIso(), {
        error: "The date can't be in the future.",
      })
      .refine((v) => v >= "2000-01-01", { error: "Enter a more recent date." }),
    generalLocation: text(2, 120, "Location"),
    distinguishingFeatures: optionalText(500, "Distinguishing features"),
    verificationDetails: optionalText(500, "Private verification details"),
    contactPreference: z.enum(CONTACT_PREFERENCES).default("IN_APP"),
    imageIds: z.array(z.uuid()).max(3).default([]),
  })
  .superRefine((data, ctx) => {
    for (const field of [
      "title",
      "description",
      "distinguishingFeatures",
      "generalLocation",
    ] as const) {
      if (containsContactDetails(data[field])) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message:
            "Please remove phone numbers or email addresses. People will contact you privately through Homeward.",
        });
      }
    }
  });

export type ReportFormInput = z.input<typeof reportFormSchema>;
export type ReportFormValues = z.output<typeof reportFormSchema>;

export const searchFiltersSchema = z.object({
  q: z
    .string()
    .transform(cleanText)
    .pipe(z.string().max(100))
    .optional()
    .catch(undefined),
  type: z.enum(REPORT_TYPES).optional().catch(undefined),
  category: z.string().max(60).regex(/^[a-z0-9-]+$/).optional().catch(undefined),
  location: z
    .string()
    .transform(cleanText)
    .pipe(z.string().max(120))
    .optional()
    .catch(undefined),
  from: isoDate.optional().catch(undefined),
  to: isoDate.optional().catch(undefined),
  status: z
    .enum(["active", "all", ...ITEM_STATUSES])
    .optional()
    .catch(undefined),
  sort: z.enum(["newest", "oldest", "relevance"]).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

export type SearchFilters = z.output<typeof searchFiltersSchema>;

export const claimRequestSchema = z.object({
  itemReportId: z.uuid(),
  message: text(20, 1000, "Message"),
  verificationAnswer: optionalText(500, "Identifying detail"),
});

export const claimMessageSchema = z.object({
  claimRequestId: z.uuid(),
  body: text(1, 1000, "Message"),
});

export const claimDecisionSchema = z.object({
  claimRequestId: z.uuid(),
  decision: z.enum(["ACCEPTED", "DECLINED"]),
});

export const flagSchema = z.object({
  itemReportId: z.uuid(),
  reason: z.enum(FLAG_REASONS, { error: "Choose a reason." }),
  details: optionalText(500, "Details"),
});

export const statusChangeSchema = z.object({
  itemReportId: z.uuid(),
  status: z.enum(ITEM_STATUSES),
});

export const moderationSchema = z.object({
  itemReportId: z.uuid(),
  action: z.enum(["HIDE", "RESTORE", "MARK_DUPLICATE", "CLOSE", "DISMISS_FLAGS"]),
  reason: text(3, 500, "Reason"),
  duplicateOfId: z.uuid().optional(),
});

export const profileSchema = z.object({
  name: text(2, 60, "Name"),
});

export const signUpSchema = z
  .object({
    name: text(2, 60, "Name"),
    email: z.email({ error: "Enter a valid email address." }),
    password: z
      .string()
      .min(8, { error: "Password needs at least 8 characters." })
      .max(128, { error: "Password must be 128 characters or fewer." }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords don't match.",
  });

export const signInSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(1, { error: "Enter your password." }),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(20)
    .refine((m) => m[m.length - 1]?.role === "user", {
      error: "The last message must come from the user.",
    }),
  pathname: z.string().max(200).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
