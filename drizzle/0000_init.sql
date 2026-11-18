CREATE TYPE "public"."claim_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."contact_preference" AS ENUM('IN_APP', 'DESK');--> statement-breakpoint
CREATE TYPE "public"."flag_reason" AS ENUM('SPAM', 'DUPLICATE', 'MISLEADING', 'INAPPROPRIATE', 'PERSONAL_INFO');--> statement-breakpoint
CREATE TYPE "public"."flag_status" AS ENUM('OPEN', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('HIDE', 'RESTORE', 'MARK_DUPLICATE', 'CLOSE', 'DISMISS_FLAGS');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('LOST', 'FOUND');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('VISIBLE', 'HIDDEN');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_report_id" text,
	"claim_request_id" text,
	"message" varchar(300) NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(60) NOT NULL,
	"slug" varchar(60) NOT NULL,
	"icon" varchar(40) DEFAULT 'package' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "claim_message" (
	"id" text PRIMARY KEY NOT NULL,
	"claim_request_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_request" (
	"id" text PRIMARY KEY NOT NULL,
	"item_report_id" text NOT NULL,
	"requester_id" text NOT NULL,
	"message" text NOT NULL,
	"verification_answer" text,
	"status" "claim_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_image" (
	"id" text PRIMARY KEY NOT NULL,
	"item_report_id" text,
	"uploader_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"thumb_key" text NOT NULL,
	"mime_type" varchar(40) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"size_bytes" integer NOT NULL,
	"alt_text" varchar(200),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_image_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "item_report" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"report_type" "report_type" NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"category_id" integer NOT NULL,
	"general_location" varchar(120) NOT NULL,
	"event_date" date NOT NULL,
	"distinguishing_features" text,
	"verification_details" text,
	"contact_preference" "contact_preference" DEFAULT 'IN_APP' NOT NULL,
	"status" "item_status" DEFAULT 'OPEN' NOT NULL,
	"visibility" "visibility" DEFAULT 'VISIBLE' NOT NULL,
	"duplicate_of_id" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_flag" (
	"id" text PRIMARY KEY NOT NULL,
	"item_report_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" "flag_reason" NOT NULL,
	"details" varchar(500),
	"status" "flag_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_record" (
	"id" text PRIMARY KEY NOT NULL,
	"item_report_id" text NOT NULL,
	"moderator_id" text,
	"action" "moderation_action" NOT NULL,
	"reason" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_item_report_id_item_report_id_fk" FOREIGN KEY ("item_report_id") REFERENCES "public"."item_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_event" ADD CONSTRAINT "activity_event_claim_request_id_claim_request_id_fk" FOREIGN KEY ("claim_request_id") REFERENCES "public"."claim_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_message" ADD CONSTRAINT "claim_message_claim_request_id_claim_request_id_fk" FOREIGN KEY ("claim_request_id") REFERENCES "public"."claim_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_message" ADD CONSTRAINT "claim_message_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request" ADD CONSTRAINT "claim_request_item_report_id_item_report_id_fk" FOREIGN KEY ("item_report_id") REFERENCES "public"."item_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request" ADD CONSTRAINT "claim_request_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_image" ADD CONSTRAINT "item_image_item_report_id_item_report_id_fk" FOREIGN KEY ("item_report_id") REFERENCES "public"."item_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_image" ADD CONSTRAINT "item_image_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_report" ADD CONSTRAINT "item_report_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_report" ADD CONSTRAINT "item_report_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_report" ADD CONSTRAINT "item_report_duplicate_of_id_item_report_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."item_report"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_flag" ADD CONSTRAINT "listing_flag_item_report_id_item_report_id_fk" FOREIGN KEY ("item_report_id") REFERENCES "public"."item_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_flag" ADD CONSTRAINT "listing_flag_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_record" ADD CONSTRAINT "moderation_record_item_report_id_item_report_id_fk" FOREIGN KEY ("item_report_id") REFERENCES "public"."item_report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_record" ADD CONSTRAINT "moderation_record_moderator_id_user_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_user_idx" ON "activity_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "message_claim_idx" ON "claim_message" USING btree ("claim_request_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "claim_item_requester_uq" ON "claim_request" USING btree ("item_report_id","requester_id");--> statement-breakpoint
CREATE INDEX "claim_requester_idx" ON "claim_request" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "claim_status_idx" ON "claim_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "image_item_idx" ON "item_image" USING btree ("item_report_id");--> statement-breakpoint
CREATE INDEX "image_uploader_idx" ON "item_image" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "item_user_idx" ON "item_report" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "item_browse_idx" ON "item_report" USING btree ("visibility","status","created_at");--> statement-breakpoint
CREATE INDEX "item_type_idx" ON "item_report" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "item_category_idx" ON "item_report" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "item_event_date_idx" ON "item_report" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "item_search_idx" ON "item_report" USING gin (to_tsvector('english', "title" || ' ' || "description" || ' ' || coalesce("distinguishing_features", '')));--> statement-breakpoint
CREATE UNIQUE INDEX "flag_item_reporter_uq" ON "listing_flag" USING btree ("item_report_id","reporter_id");--> statement-breakpoint
CREATE INDEX "flag_status_idx" ON "listing_flag" USING btree ("status");--> statement-breakpoint
CREATE INDEX "moderation_item_idx" ON "moderation_record" USING btree ("item_report_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");