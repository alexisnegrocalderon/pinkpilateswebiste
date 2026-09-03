import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { reservationSource, reservationStatus, waitlistStatus } from "./enums";
import { users } from "./identity";
import { memberships } from "./memberships";
import { classSessions } from "./scheduling";

/**
 * Reserva. NO existe una tabla `attendance` aparte: la reserva ES la asistencia
 * (`checkedInAt` + status en attended/no_show). Evita el clásico bug de
 * asistencias huérfanas que no calzan con ninguna reserva.
 */
export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => classSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** NULL mientras es una clase suelta con pago pendiente. */
    membershipId: uuid("membership_id").references(() => memberships.id),
    orderId: uuid("order_id"),
    status: reservationStatus("status").notNull().default("booked"),
    source: reservationSource("source").notNull().default("web"),
    /** Si consumió un crédito de la membresía (determina si hay algo que devolver). */
    creditCharged: boolean("credit_charged").notNull().default(false),
    bookedAt: timestamp("booked_at", { withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: uuid("cancelled_by").references(() => users.id),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    markedBy: uuid("marked_by").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /**
     * Impide la doble reserva, pero permite volver a reservar tras cancelar
     * (los estados cancelados quedan fuera del índice).
     */
    uniqueIndex("uq_reservation_active")
      .on(t.sessionId, t.studentId)
      .where(sql`${t.status} IN ('booked','attended','no_show')`),
    index("idx_res_session_status").on(t.sessionId, t.status),
    index("idx_res_student").on(t.studentId, t.bookedAt),
    index("idx_res_membership").on(t.membershipId),
  ],
);

/**
 * Lista de espera. El orden es FIFO por `createdAt` — deliberadamente sin
 * columna `position`, para no tener que renumerar cuando alguien sale del medio.
 */
export const waitlistEntries = pgTable(
  "waitlist_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => classSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: waitlistStatus("status").notNull().default("waiting"),
    /** Si es true, al liberarse un cupo se reserva automáticamente. */
    autoBook: boolean("auto_book").notNull().default(true),
    offeredAt: timestamp("offered_at", { withTimezone: true }),
    offerExpiresAt: timestamp("offer_expires_at", { withTimezone: true }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    promotedAt: timestamp("promoted_at", { withTimezone: true }),
    reservationId: uuid("reservation_id").references(() => reservations.id),
    expiredReason: text("expired_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_waitlist_active")
      .on(t.sessionId, t.studentId)
      .where(sql`${t.status} IN ('waiting','offered')`),
    index("idx_waitlist_fifo").on(t.sessionId, t.createdAt),
  ],
);
