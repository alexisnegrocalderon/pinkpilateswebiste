import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { citext } from "./_types";
import { classTypes } from "./catalog";
import { creditReason, membershipStatus, planSegment } from "./enums";
import { users } from "./identity";

/**
 * Catálogo de planes. Refleja la matriz real de pinkpilates.cl:
 * segmento (adulto / estudiante / valle / especial) × periodicidad × créditos.
 *
 * Todo el negocio es por créditos — "1 Crédito es el equivalente a 1 clase" —
 * así que no existe el concepto de plan ilimitado.
 */
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: citext("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    segment: planSegment("segment").notNull(),
    /** 1 = mensual, 3 = trimestral, 6 = semestral, 12 = anual. */
    periodMonths: smallint("period_months").notNull().default(1),
    credits: integer("credits").notNull(),
    priceClp: integer("price_clp").notNull(),
    /** Días de vigencia desde la activación. */
    validityDays: smallint("validity_days").notNull(),
    /** Plan estudiante: exige certificado de alumno regular aprobado por la dueña. */
    requiresVerification: boolean("requires_verification").notNull().default(false),
    /** Clase suelta: habilita el flujo de compra con reserva en espera de pago. */
    isDropIn: boolean("is_drop_in").notNull().default(false),

    /* --- Restricción de horario (planes valle) ---
       NULL en los tres campos = sin restricción. El plan valle sólo permite
       gastar créditos de lunes a viernes entre las 15:00 y las 17:59. */
    allowedWeekdays: smallint("allowed_weekdays").array(),
    allowedTimeFrom: time("allowed_time_from"),
    allowedTimeTo: time("allowed_time_to"),

    maxBookingsPerDay: smallint("max_bookings_per_day").notNull().default(1),
    isPublic: boolean("is_public").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: smallint("sort_order").notNull().default(0),
    badge: text("badge"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_plans_slug").on(t.slug),
    check("ck_plans_credits", sql`${t.credits} >= 1`),
    check("ck_plans_price", sql`${t.priceClp} >= 0`),
    check("ck_plans_validity", sql`${t.validityDays} >= 1`),
    index("idx_plans_public").on(t.isPublic, t.sortOrder),
  ],
);

/** Sin filas para un plan = el plan cubre TODOS los tipos de clase activos. */
export const planClassTypes = pgTable(
  "plan_class_types",
  {
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    classTypeId: uuid("class_type_id")
      .notNull()
      .references(() => classTypes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.planId, t.classTypeId] })],
);

/** Instancia comprada por una alumna. */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    orderId: uuid("order_id"),
    status: membershipStatus("status").notNull().default("pending_verification"),
    creditsTotal: integer("credits_total").notNull(),
    creditsUsed: integer("credits_used").notNull().default(0),
    startsOn: date("starts_on").notNull(),
    /** Inclusive: la membresía vale hasta el final de este día. */
    endsOn: date("ends_on").notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    depletedAt: timestamp("depleted_at", { withTimezone: true }),
    /** Histórico: si mañana sube el precio del plan, lo pagado no cambia. */
    pricePaidClp: integer("price_paid_clp").notNull().default(0),
    /** Certificado de alumno regular, para planes de segmento estudiante. */
    verificationNote: text("verification_note"),
    verifiedBy: uuid("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Impide gastar créditos que no existen, aun bajo concurrencia. */
    check("ck_membership_credits", sql`${t.creditsUsed} >= 0 AND ${t.creditsUsed} <= ${t.creditsTotal}`),
    check("ck_membership_dates", sql`${t.endsOn} >= ${t.startsOn}`),
    index("idx_memberships_student_status").on(t.studentId, t.status),
    index("idx_memberships_ends").on(t.endsOn),
  ],
);

/**
 * Libro mayor de créditos, append-only. `memberships.credits_used` es la
 * proyección; esta tabla es la auditoría y la que hace idempotentes las
 * devoluciones.
 */
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Negativo = consumo, positivo = devolución. 0 = marca (pérdida por no-show). */
    delta: integer("delta").notNull(),
    reason: creditReason("reason").notNull(),
    reservationId: uuid("reservation_id"),
    orderId: uuid("order_id"),
    balanceAfter: integer("balance_after"),
    note: text("note"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Un doble click no puede devolver dos veces el mismo crédito. */
    uniqueIndex("uq_credit_tx_idem")
      .on(t.reservationId, t.reason)
      .where(sql`${t.reservationId} IS NOT NULL`),
    index("idx_credit_tx_membership").on(t.membershipId, t.createdAt),
  ],
);
