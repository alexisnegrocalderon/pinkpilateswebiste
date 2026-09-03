CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "citext";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "btree_gist";--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."class_level" AS ENUM('intro', 'all_levels', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."credit_reason" AS ENUM('purchase', 'booking', 'cancellation_refund', 'late_cancel_forfeit', 'no_show_forfeit', 'studio_cancel_refund', 'admin_adjust', 'expiration');--> statement-breakpoint
CREATE TYPE "public"."discipline" AS ENUM('apparatus', 'mat', 'barre', 'dance', 'prenatal', 'senior', 'bridal', 'teacher_training');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'converted', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('pending_verification', 'active', 'expired', 'depleted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_item_kind" AS ENUM('plan', 'drop_in');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'awaiting_payment', 'paid', 'failed', 'expired', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('queued', 'sending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'pending', 'authorized', 'paid', 'failed', 'refunded', 'expired');--> statement-breakpoint
CREATE TYPE "public"."plan_segment" AS ENUM('adult', 'student', 'valle', 'special');--> statement-breakpoint
CREATE TYPE "public"."reservation_source" AS ENUM('web', 'admin', 'waitlist');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('booked', 'attended', 'no_show', 'cancelled', 'late_cancelled', 'studio_cancelled');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'instructor', 'student');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'invited');--> statement-breakpoint
CREATE TYPE "public"."waitlist_status" AS ENUM('waiting', 'offered', 'promoted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "instructor_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"bio" text,
	"specialties" "discipline"[],
	"calendar_color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"certifications" text
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"health_notes" text,
	"is_pregnant" boolean DEFAULT false NOT NULL,
	"pregnancy_due_date" date,
	"goals" text,
	"referral_source" text,
	"marketing_opt_in" boolean DEFAULT true NOT NULL,
	"internal_notes" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"rut" text,
	"birth_date" date,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"failed_login_count" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" "citext" NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"description" text,
	"discipline" "discipline" NOT NULL,
	"level" "class_level" DEFAULT 'all_levels' NOT NULL,
	"default_duration_min" smallint DEFAULT 60 NOT NULL,
	"default_capacity" smallint NOT NULL,
	"drop_in_price_clp" integer NOT NULL,
	"color" text,
	"image_url" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"code" text NOT NULL,
	"is_operational" boolean DEFAULT true NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"capacity" smallint NOT NULL,
	"description" text,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"class_type_id" uuid NOT NULL,
	"instructor_id" uuid,
	"room_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"start_time" time NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"duration_min" smallint NOT NULL,
	"capacity" smallint NOT NULL,
	"booked_count" smallint DEFAULT 0 NOT NULL,
	"waitlist_count" smallint DEFAULT 0 NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"cancellation_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_session_booked_within_capacity" CHECK ("class_sessions"."booked_count" >= 0 AND "class_sessions"."booked_count" <= "class_sessions"."capacity"),
	CONSTRAINT "ck_session_capacity" CHECK ("class_sessions"."capacity" > 0),
	CONSTRAINT "ck_session_waitlist" CHECK ("class_sessions"."waitlist_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "class_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_type_id" uuid NOT NULL,
	"instructor_id" uuid,
	"room_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" time NOT NULL,
	"duration_min" smallint DEFAULT 60 NOT NULL,
	"capacity" smallint NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"timezone" text DEFAULT 'America/Santiago' NOT NULL,
	"materialized_through" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_template_weekday" CHECK ("class_templates"."weekday" BETWEEN 0 AND 6),
	CONSTRAINT "ck_template_capacity" CHECK ("class_templates"."capacity" > 0),
	CONSTRAINT "ck_template_range" CHECK ("class_templates"."effective_to" IS NULL OR "class_templates"."effective_to" >= "class_templates"."effective_from")
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"membership_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" "credit_reason" NOT NULL,
	"reservation_id" uuid,
	"order_id" uuid,
	"balance_after" integer,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"order_id" uuid,
	"status" "membership_status" DEFAULT 'pending_verification' NOT NULL,
	"credits_total" integer NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"activated_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"depleted_at" timestamp with time zone,
	"price_paid_clp" integer DEFAULT 0 NOT NULL,
	"verification_note" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_membership_credits" CHECK ("memberships"."credits_used" >= 0 AND "memberships"."credits_used" <= "memberships"."credits_total"),
	CONSTRAINT "ck_membership_dates" CHECK ("memberships"."ends_on" >= "memberships"."starts_on")
);
--> statement-breakpoint
CREATE TABLE "plan_class_types" (
	"plan_id" uuid NOT NULL,
	"class_type_id" uuid NOT NULL,
	CONSTRAINT "plan_class_types_plan_id_class_type_id_pk" PRIMARY KEY("plan_id","class_type_id")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" "citext" NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"segment" "plan_segment" NOT NULL,
	"period_months" smallint DEFAULT 1 NOT NULL,
	"credits" integer NOT NULL,
	"price_clp" integer NOT NULL,
	"validity_days" smallint NOT NULL,
	"requires_verification" boolean DEFAULT false NOT NULL,
	"is_drop_in" boolean DEFAULT false NOT NULL,
	"allowed_weekdays" smallint[],
	"allowed_time_from" time,
	"allowed_time_to" time,
	"max_bookings_per_day" smallint DEFAULT 1 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"badge" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_plans_credits" CHECK ("plans"."credits" >= 1),
	CONSTRAINT "ck_plans_price" CHECK ("plans"."price_clp" >= 0),
	CONSTRAINT "ck_plans_validity" CHECK ("plans"."validity_days" >= 1)
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"membership_id" uuid,
	"order_id" uuid,
	"status" "reservation_status" DEFAULT 'booked' NOT NULL,
	"source" "reservation_source" DEFAULT 'web' NOT NULL,
	"credit_charged" boolean DEFAULT false NOT NULL,
	"booked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"checked_in_at" timestamp with time zone,
	"marked_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "waitlist_status" DEFAULT 'waiting' NOT NULL,
	"auto_book" boolean DEFAULT true NOT NULL,
	"offered_at" timestamp with time zone,
	"offer_expires_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"promoted_at" timestamp with time zone,
	"reservation_id" uuid,
	"expired_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_plans" (
	"coupon_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	CONSTRAINT "coupon_plans_coupon_id_plan_id_pk" PRIMARY KEY("coupon_id","plan_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"discount_clp" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" "citext" NOT NULL,
	"description" text,
	"type" "coupon_type" NOT NULL,
	"value" integer NOT NULL,
	"min_amount_clp" integer DEFAULT 0 NOT NULL,
	"max_redemptions" integer,
	"redemptions_count" integer DEFAULT 0 NOT NULL,
	"per_student_limit" smallint DEFAULT 1 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_coupon_value" CHECK (("coupons"."type" = 'percent' AND "coupons"."value" BETWEEN 1 AND 100) OR ("coupons"."type" = 'fixed' AND "coupons"."value" > 0)),
	CONSTRAINT "ck_coupon_redemptions" CHECK ("coupons"."max_redemptions" IS NULL OR "coupons"."redemptions_count" <= "coupons"."max_redemptions")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"kind" "order_item_kind" NOT NULL,
	"plan_id" uuid,
	"class_session_id" uuid,
	"description" text NOT NULL,
	"unit_price_clp" integer NOT NULL,
	"quantity" smallint DEFAULT 1 NOT NULL,
	"total_clp" integer NOT NULL,
	CONSTRAINT "ck_order_item_target" CHECK (("order_items"."kind" = 'plan' AND "order_items"."plan_id" IS NOT NULL) OR ("order_items"."kind" = 'drop_in' AND "order_items"."class_session_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"subtotal_clp" integer DEFAULT 0 NOT NULL,
	"discount_clp" integer DEFAULT 0 NOT NULL,
	"total_clp" integer DEFAULT 0 NOT NULL,
	"coupon_id" uuid,
	"provider" text,
	"idempotency_key" text,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_order_totals" CHECK ("orders"."total_clp" = "orders"."subtotal_clp" - "orders"."discount_clp" AND "orders"."total_clp" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text,
	"payment_id" uuid,
	"signature_valid" boolean DEFAULT false NOT NULL,
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"process_error" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_payment_id" text,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"amount_clp" integer NOT NULL,
	"redirect_url" text,
	"payment_method" text,
	"paid_at" timestamp with time zone,
	"failure_reason" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_clp" integer NOT NULL,
	"reason" text,
	"provider_refund_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" "citext" NOT NULL,
	"phone" text,
	"message" text,
	"interest" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"audience_filter" jsonb,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"recipients_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"to_email" "citext" NOT NULL,
	"to_user_id" uuid,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"template_key" text,
	"campaign_id" uuid,
	"status" "outbox_status" DEFAULT 'queued' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"provider_message_id" text,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "citext" NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_body" text NOT NULL,
	"text_body" text,
	"sample_vars" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_user_id" uuid,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"summary" text,
	"diff" jsonb,
	"ip" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_profiles" ADD CONSTRAINT "instructor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_template_id_class_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."class_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_type_id_class_types_id_fk" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_templates" ADD CONSTRAINT "class_templates_class_type_id_class_types_id_fk" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_templates" ADD CONSTRAINT "class_templates_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_templates" ADD CONSTRAINT "class_templates_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_class_types" ADD CONSTRAINT "plan_class_types_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_class_types" ADD CONSTRAINT "plan_class_types_class_type_id_class_types_id_fk" FOREIGN KEY ("class_type_id") REFERENCES "public"."class_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_plans" ADD CONSTRAINT "coupon_plans_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_plans" ADD CONSTRAINT "coupon_plans_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_class_session_id_class_sessions_id_fk" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_campaign_id_email_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."email_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_user" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_expires" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_users_rut" ON "users" USING btree ("rut") WHERE "users"."rut" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_role_status" ON "users" USING btree ("role","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_class_types_slug" ON "class_types" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_equipment_room_code" ON "equipment" USING btree ("room_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_rooms_name" ON "rooms" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_session_template_date" ON "class_sessions" USING btree ("template_id","local_date");--> statement-breakpoint
CREATE INDEX "idx_sessions_starts" ON "class_sessions" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_date_status" ON "class_sessions" USING btree ("local_date","status");--> statement-breakpoint
CREATE INDEX "idx_sessions_instructor" ON "class_sessions" USING btree ("instructor_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_type" ON "class_sessions" USING btree ("class_type_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_templates_weekday" ON "class_templates" USING btree ("weekday","start_time");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_credit_tx_idem" ON "credit_transactions" USING btree ("reservation_id","reason") WHERE "credit_transactions"."reservation_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_credit_tx_membership" ON "credit_transactions" USING btree ("membership_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_memberships_student_status" ON "memberships" USING btree ("student_id","status");--> statement-breakpoint
CREATE INDEX "idx_memberships_ends" ON "memberships" USING btree ("ends_on");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_plans_slug" ON "plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_plans_public" ON "plans" USING btree ("is_public","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reservation_active" ON "reservations" USING btree ("session_id","student_id") WHERE "reservations"."status" IN ('booked','attended','no_show');--> statement-breakpoint
CREATE INDEX "idx_res_session_status" ON "reservations" USING btree ("session_id","status");--> statement-breakpoint
CREATE INDEX "idx_res_student" ON "reservations" USING btree ("student_id","booked_at");--> statement-breakpoint
CREATE INDEX "idx_res_membership" ON "reservations" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_waitlist_active" ON "waitlist_entries" USING btree ("session_id","student_id") WHERE "waitlist_entries"."status" IN ('waiting','offered');--> statement-breakpoint
CREATE INDEX "idx_waitlist_fifo" ON "waitlist_entries" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_redemption_order" ON "coupon_redemptions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_redemption_coupon_student" ON "coupon_redemptions" USING btree ("coupon_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coupons_code" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orders_number" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orders_idempotency" ON "orders" USING btree ("idempotency_key") WHERE "orders"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_orders_student" ON "orders" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payment_event" ON "payment_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payment_provider_id" ON "payments" USING btree ("provider","provider_payment_id") WHERE "payments"."provider_payment_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_outbox_dedupe" ON "email_outbox" USING btree ("dedupe_key") WHERE "email_outbox"."dedupe_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_outbox_pending" ON "email_outbox" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_outbox_campaign" ON "email_outbox" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_email_templates_key" ON "email_templates" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_log" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_actor" ON "audit_log" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_log" USING btree ("created_at");
--> statement-breakpoint
-- Imposibilita agendar dos clases solapadas en la misma sala. Es una garantia
-- de la base, no una validacion de la aplicacion: ninguna ruta, script ni
-- consola puede saltarsela. Requiere btree_gist.
ALTER TABLE "class_sessions" ADD CONSTRAINT "ex_session_room_overlap"
  EXCLUDE USING gist (
    "room_id" WITH =,
    tstzrange("starts_at", "ends_at") WITH &&
  ) WHERE ("status" <> 'cancelled');--> statement-breakpoint
-- Secuencia para el numero legible de orden (PP-2026-000123).
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
