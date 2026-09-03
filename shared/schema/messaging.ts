import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { citext } from "./_types";
import { campaignStatus, leadStatus, outboxStatus } from "./enums";
import { users } from "./identity";

export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: citext("key").notNull(),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    htmlBody: text("html_body").notNull(),
    textBody: text("text_body"),
    /** Variables de ejemplo para la previsualización del editor. */
    sampleVars: jsonb("sample_vars"),
    isActive: boolean("is_active").notNull().default(true),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_email_templates_key").on(t.key)],
);

export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  /** { membership: 'active'|'expiring'|'expired'|'none', inactiveDays: n, marketingOptIn: true } */
  audienceFilter: jsonb("audience_filter"),
  status: campaignStatus("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  recipientsCount: integer("recipients_count").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Toda escritura de email pasa por aquí. Nunca se llama al proveedor SMTP
 * dentro de una transacción de negocio: si el envío falla, la reserva no
 * debe deshacerse.
 */
export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    toEmail: citext("to_email").notNull(),
    toUserId: uuid("to_user_id").references(() => users.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    htmlBody: text("html_body").notNull(),
    textBody: text("text_body"),
    templateKey: text("template_key"),
    campaignId: uuid("campaign_id").references(() => emailCampaigns.id, { onDelete: "cascade" }),
    status: outboxStatus("status").notNull().default("queued"),
    attempts: smallint("attempts").notNull().default(0),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    lastError: text("last_error"),
    providerMessageId: text("provider_message_id"),
    /** p.ej. "session_cancel:<sessionId>:<userId>" — evita duplicados si el cron corre dos veces. */
    dedupeKey: text("dedupe_key"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_outbox_dedupe")
      .on(t.dedupeKey)
      .where(sql`${t.dedupeKey} IS NOT NULL`),
    index("idx_outbox_pending").on(t.status, t.scheduledFor),
    index("idx_outbox_campaign").on(t.campaignId),
  ],
);

export const contactLeads = pgTable("contact_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: citext("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  interest: text("interest"),
  status: leadStatus("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
