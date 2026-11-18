import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import {
  CLAIM_STATUSES,
  CONTACT_PREFERENCES,
  FLAG_REASONS,
  ITEM_STATUSES,
  MODERATION_ACTIONS,
  REPORT_TYPES,
} from "../lib/constants";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/* Better Auth tables (field names match Better Auth's expected schema)       */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  /** "user" | "admin". Not user-editable (input: false in auth config). */
  role: text("role").notNull().default("user"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

/* -------------------------------------------------------------------------- */
/* Domain tables                                                              */
/* -------------------------------------------------------------------------- */

export const reportTypeEnum = pgEnum("report_type", REPORT_TYPES);
export const itemStatusEnum = pgEnum("item_status", ITEM_STATUSES);
export const claimStatusEnum = pgEnum("claim_status", CLAIM_STATUSES);
export const contactPreferenceEnum = pgEnum(
  "contact_preference",
  CONTACT_PREFERENCES,
);
export const flagReasonEnum = pgEnum("flag_reason", FLAG_REASONS);
export const flagStatusEnum = pgEnum("flag_status", [
  "OPEN",
  "RESOLVED",
  "DISMISSED",
]);
export const moderationActionEnum = pgEnum(
  "moderation_action",
  MODERATION_ACTIONS,
);
export const visibilityEnum = pgEnum("visibility", ["VISIBLE", "HIDDEN"]);

export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 60 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  /** Lucide icon key, resolved in the UI. */
  icon: varchar("icon", { length: 40 }).notNull().default("package"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const itemReport = pgTable(
  "item_report",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reportType: reportTypeEnum("report_type").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    generalLocation: varchar("general_location", { length: 120 }).notNull(),
    eventDate: date("event_date", { mode: "string" }).notNull(),
    /** Public distinguishing features (colour, brand, stickers…). */
    distinguishingFeatures: text("distinguishing_features"),
    /**
     * PRIVATE. Details only the true owner would know (found reports only).
     * Never selected by public queries; shown only to the reporter.
     */
    verificationDetails: text("verification_details"),
    contactPreference: contactPreferenceEnum("contact_preference")
      .notNull()
      .default("IN_APP"),
    status: itemStatusEnum("status").notNull().default("OPEN"),
    visibility: visibilityEnum("visibility").notNull().default("VISIBLE"),
    duplicateOfId: text("duplicate_of_id").references(
      (): AnyPgColumn => itemReport.id,
      { onDelete: "set null" },
    ),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("item_user_idx").on(t.userId),
    index("item_browse_idx").on(t.visibility, t.status, t.createdAt),
    index("item_type_idx").on(t.reportType),
    index("item_category_idx").on(t.categoryId),
    index("item_event_date_idx").on(t.eventDate),
    index("item_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${t.title} || ' ' || ${t.description} || ' ' || coalesce(${t.distinguishingFeatures}, ''))`,
    ),
  ],
);

export const itemImage = pgTable(
  "item_image",
  {
    id: id(),
    /** Null until the report that uses this upload is saved. */
    itemReportId: text("item_report_id").references(() => itemReport.id, {
      onDelete: "cascade",
    }),
    uploaderId: text("uploader_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull().unique(),
    thumbKey: text("thumb_key").notNull(),
    mimeType: varchar("mime_type", { length: 40 }).notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    altText: varchar("alt_text", { length: 200 }),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("image_item_idx").on(t.itemReportId),
    index("image_uploader_idx").on(t.uploaderId),
  ],
);

export const claimRequest = pgTable(
  "claim_request",
  {
    id: id(),
    itemReportId: text("item_report_id")
      .notNull()
      .references(() => itemReport.id, { onDelete: "cascade" }),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    /** Claimant's answer describing a private detail (found items). */
    verificationAnswer: text("verification_answer"),
    status: claimStatusEnum("status").notNull().default("PENDING"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("claim_item_requester_uq").on(t.itemReportId, t.requesterId),
    index("claim_requester_idx").on(t.requesterId),
    index("claim_status_idx").on(t.status),
  ],
);

export const claimMessage = pgTable(
  "claim_message",
  {
    id: id(),
    claimRequestId: text("claim_request_id")
      .notNull()
      .references(() => claimRequest.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("message_claim_idx").on(t.claimRequestId, t.createdAt)],
);

export const listingFlag = pgTable(
  "listing_flag",
  {
    id: id(),
    itemReportId: text("item_report_id")
      .notNull()
      .references(() => itemReport.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: flagReasonEnum("reason").notNull(),
    details: varchar("details", { length: 500 }),
    status: flagStatusEnum("status").notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("flag_item_reporter_uq").on(t.itemReportId, t.reporterId),
    index("flag_status_idx").on(t.status),
  ],
);

export const moderationRecord = pgTable(
  "moderation_record",
  {
    id: id(),
    itemReportId: text("item_report_id")
      .notNull()
      .references(() => itemReport.id, { onDelete: "cascade" }),
    moderatorId: text("moderator_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: moderationActionEnum("action").notNull(),
    reason: varchar("reason", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("moderation_item_idx").on(t.itemReportId)],
);

export const activityEvent = pgTable(
  "activity_event",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemReportId: text("item_report_id").references(() => itemReport.id, {
      onDelete: "cascade",
    }),
    claimRequestId: text("claim_request_id").references(
      () => claimRequest.id,
      { onDelete: "cascade" },
    ),
    message: varchar("message", { length: 300 }).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("activity_user_idx").on(t.userId, t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const userRelations = relations(user, ({ many }) => ({
  reports: many(itemReport),
  claims: many(claimRequest),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  reports: many(itemReport),
}));

export const itemReportRelations = relations(itemReport, ({ one, many }) => ({
  owner: one(user, { fields: [itemReport.userId], references: [user.id] }),
  category: one(category, {
    fields: [itemReport.categoryId],
    references: [category.id],
  }),
  images: many(itemImage),
  claims: many(claimRequest),
}));

export const itemImageRelations = relations(itemImage, ({ one }) => ({
  report: one(itemReport, {
    fields: [itemImage.itemReportId],
    references: [itemReport.id],
  }),
}));

export const claimRequestRelations = relations(
  claimRequest,
  ({ one, many }) => ({
    report: one(itemReport, {
      fields: [claimRequest.itemReportId],
      references: [itemReport.id],
    }),
    requester: one(user, {
      fields: [claimRequest.requesterId],
      references: [user.id],
    }),
    messages: many(claimMessage),
  }),
);

export const claimMessageRelations = relations(claimMessage, ({ one }) => ({
  claim: one(claimRequest, {
    fields: [claimMessage.claimRequestId],
    references: [claimRequest.id],
  }),
  sender: one(user, { fields: [claimMessage.senderId], references: [user.id] }),
}));
