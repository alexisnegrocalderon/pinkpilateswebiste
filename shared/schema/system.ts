import { bigserial, index, inet, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorRole: text("actor_role"),
    /** "reservation.cancel", "membership.credits.adjust", "session.cancel". */
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    /** Resumen legible en español, para mostrarlo tal cual en la UI. */
    summary: text("summary"),
    diff: jsonb("diff"),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_audit_entity").on(t.entityType, t.entityId, t.createdAt),
    index("idx_audit_actor").on(t.actorUserId, t.createdAt),
    index("idx_audit_created").on(t.createdAt),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
