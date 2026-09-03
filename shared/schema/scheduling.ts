import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { classTypes, rooms } from "./catalog";
import { sessionStatus } from "./enums";
import { users } from "./identity";

/**
 * Regla semanal recurrente: "todos los martes a las 19:00 en Sala Reformer".
 * No es reservable — sólo genera ocurrencias en `class_sessions`.
 */
export const classTemplates = pgTable(
  "class_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classTypeId: uuid("class_type_id")
      .notNull()
      .references(() => classTypes.id),
    instructorId: uuid("instructor_id").references(() => users.id),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    /** 0 = domingo .. 6 = sábado, en hora local de Santiago. */
    weekday: smallint("weekday").notNull(),
    /** Hora de pared local, NO un instante. El instante se calcula al materializar. */
    startTime: time("start_time").notNull(),
    durationMin: smallint("duration_min").notNull().default(60),
    capacity: smallint("capacity").notNull(),
    effectiveFrom: date("effective_from").notNull(),
    /** NULL = vigencia indefinida. */
    effectiveTo: date("effective_to"),
    timezone: text("timezone").notNull().default("America/Santiago"),
    /** Última fecha ya materializada; hace el job idempotente y barato. */
    materializedThrough: date("materialized_through"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("ck_template_weekday", sql`${t.weekday} BETWEEN 0 AND 6`),
    check("ck_template_capacity", sql`${t.capacity} > 0`),
    check("ck_template_range", sql`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`),
    index("idx_templates_weekday").on(t.weekday, t.startTime),
  ],
);

/**
 * Ocurrencia concreta y fechada. Es la ÚNICA entidad reservable.
 *
 * `classTypeId`, `instructorId`, `roomId` y `capacity` se COPIAN de la plantilla al
 * materializar: editar la plantilla no debe reescribir clases pasadas ni las que ya
 * tienen alumnas inscritas.
 */
export const classSessions = pgTable(
  "class_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** NULL = clase puntual creada a mano, fuera de toda plantilla. */
    templateId: uuid("template_id").references(() => classTemplates.id, { onDelete: "set null" }),
    classTypeId: uuid("class_type_id")
      .notNull()
      .references(() => classTypes.id),
    instructorId: uuid("instructor_id").references(() => users.id),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    /** Fecha en Santiago. Junto con startTime define starts_at. */
    localDate: date("local_date").notNull(),
    startTime: time("start_time").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    durationMin: smallint("duration_min").notNull(),
    capacity: smallint("capacity").notNull(),
    /** Denormalizado a propósito: es la fuente de verdad de los cupos y el punto
     *  donde se serializa la concurrencia (ver server/sql/bookSpot.sql.ts). */
    bookedCount: smallint("booked_count").notNull().default(0),
    waitlistCount: smallint("waitlist_count").notNull().default(0),
    status: sessionStatus("status").notNull().default("scheduled"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: uuid("cancelled_by").references(() => users.id),
    cancellationReason: text("cancellation_reason"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Red de seguridad final contra el overbooking, incluso si alguien escribe por fuera. */
    check("ck_session_booked_within_capacity", sql`${t.bookedCount} >= 0 AND ${t.bookedCount} <= ${t.capacity}`),
    check("ck_session_capacity", sql`${t.capacity} > 0`),
    check("ck_session_waitlist", sql`${t.waitlistCount} >= 0`),
    /** Hace la materialización idempotente: re-correr el job no duplica clases. */
    uniqueIndex("uq_session_template_date").on(t.templateId, t.localDate),
    index("idx_sessions_starts").on(t.startsAt),
    index("idx_sessions_date_status").on(t.localDate, t.status),
    index("idx_sessions_instructor").on(t.instructorId, t.startsAt),
    index("idx_sessions_type").on(t.classTypeId, t.startsAt),
  ],
);
