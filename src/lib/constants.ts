/**
 * Shared domain vocabulary. Labels use plain, real-world language
 * (Nielsen #2: match between system and the real world) and every status
 * has a text label plus an explanation so state is never conveyed by colour alone.
 */

export const REPORT_TYPES = ["LOST", "FOUND"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  LOST: "Lost",
  FOUND: "Found",
};

export const ITEM_STATUSES = ["OPEN", "PENDING", "RESOLVED", "CLOSED"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const ITEM_STATUS_INFO: Record<
  ItemStatus,
  { label: string; description: string }
> = {
  OPEN: {
    label: "Open",
    description: "Still looking. Claims and messages are welcome.",
  },
  PENDING: {
    label: "Claim in progress",
    description: "A claim has been accepted and a handover is being arranged.",
  },
  RESOLVED: {
    label: "Reunited",
    description: "The item has been returned to its owner.",
  },
  CLOSED: {
    label: "Closed",
    description: "The reporter closed this listing. It no longer accepts claims.",
  },
};

export const CLAIM_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "WITHDRAWN",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_STATUS_INFO: Record<
  ClaimStatus,
  { label: string; description: string }
> = {
  PENDING: {
    label: "Awaiting reply",
    description: "The reporter has not responded yet.",
  },
  ACCEPTED: {
    label: "Accepted",
    description: "The reporter accepted. Use the conversation to arrange a handover.",
  },
  DECLINED: {
    label: "Declined",
    description: "The reporter did not think this was a match.",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    description: "The request was withdrawn by the person who sent it.",
  },
};

export const CONTACT_PREFERENCES = ["IN_APP", "DESK"] as const;
export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];

export const CONTACT_PREFERENCE_INFO: Record<
  ContactPreference,
  { label: string; description: string }
> = {
  IN_APP: {
    label: "Private messages on Homeward",
    description:
      "People send you a request through the site. Your email and phone stay hidden.",
  },
  DESK: {
    label: "Campus Lost & Found desk",
    description:
      "Handover happens at the Student Services desk. Requests still arrive through the site.",
  },
};

export const FLAG_REASONS = [
  "SPAM",
  "DUPLICATE",
  "MISLEADING",
  "INAPPROPRIATE",
  "PERSONAL_INFO",
] as const;
export type FlagReason = (typeof FLAG_REASONS)[number];

export const FLAG_REASON_LABEL: Record<FlagReason, string> = {
  SPAM: "Spam or advertising",
  DUPLICATE: "Duplicate of another listing",
  MISLEADING: "Misleading or false",
  INAPPROPRIATE: "Offensive or inappropriate",
  PERSONAL_INFO: "Shows someone's personal information",
};

export const MODERATION_ACTIONS = [
  "HIDE",
  "RESTORE",
  "MARK_DUPLICATE",
  "CLOSE",
  "DISMISS_FLAGS",
] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const MODERATION_ACTION_LABEL: Record<ModerationAction, string> = {
  HIDE: "Hidden from public",
  RESTORE: "Restored",
  MARK_DUPLICATE: "Marked as duplicate",
  CLOSE: "Closed",
  DISMISS_FLAGS: "Flags dismissed",
};

/**
 * Suggested general locations (recognition rather than recall). Users may still
 * type any location; these appear as suggestions in a datalist.
 */
export const CAMPUS_LOCATIONS = [
  "Main Library",
  "Student Union",
  "Science Building",
  "Engineering Block",
  "Sports Centre",
  "Main Cafeteria",
  "Lecture Hall A",
  "Lecture Hall B",
  "Bus Stop – North Gate",
  "Car Park – East",
  "Halls of Residence",
  "Arts Building",
  "Computer Lab",
  "Medical Centre",
] as const;

export const UPLOAD_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxImagesPerReport: 3,
  maxDimension: 8000,
  minDimension: 64,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export const PAGE_SIZE = 12;

export const SITE = {
  name: "Homeward",
  tagline: "Campus Lost & Found",
  description:
    "Report lost or found belongings, search recent reports, and reconnect with owners safely, without sharing your phone number or email.",
} as const;
