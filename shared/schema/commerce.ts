import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { citext } from "./_types";
import { couponType, orderItemKind, orderStatus, paymentStatus } from "./enums";
import { users } from "./identity";
import { plans } from "./memberships";
import { classSessions } from "./scheduling";

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: citext("code").notNull(),
    description: text("description"),
    type: couponType("type").notNull(),
    /** percent: 1..100 · fixed: pesos enteros. */
    value: integer("value").notNull(),
    minAmountClp: integer("min_amount_clp").notNull().default(0),
    maxRedemptions: integer("max_redemptions"),
    redemptionsCount: integer("redemptions_count").notNull().default(0),
    perStudentLimit: smallint("per_student_limit").notNull().default(1),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_coupons_code").on(t.code),
    check(
      "ck_coupon_value",
      sql`(${t.type} = 'percent' AND ${t.value} BETWEEN 1 AND 100) OR (${t.type} = 'fixed' AND ${t.value} > 0)`,
    ),
    /** Cierra la carrera por el último canje disponible. */
    check("ck_coupon_redemptions", sql`${t.maxRedemptions} IS NULL OR ${t.redemptionsCount} <= ${t.maxRedemptions}`),
  ],
);

export const couponPlans = pgTable(
  "coupon_plans",
  {
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.couponId, t.planId] })],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Referencia legible que viaja a la pasarela: PP-2026-000123. */
    orderNumber: text("order_number").notNull(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: orderStatus("status").notNull().default("draft"),
    subtotalClp: integer("subtotal_clp").notNull().default(0),
    discountClp: integer("discount_clp").notNull().default(0),
    totalClp: integer("total_clp").notNull().default(0),
    couponId: uuid("coupon_id").references(() => coupons.id),
    provider: text("provider"),
    idempotencyKey: text("idempotency_key"),
    /** Vence el hold del cupo de una clase suelta (30 min). */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_orders_number").on(t.orderNumber),
    uniqueIndex("uq_orders_idempotency")
      .on(t.idempotencyKey)
      .where(sql`${t.idempotencyKey} IS NOT NULL`),
    check("ck_order_totals", sql`${t.totalClp} = ${t.subtotalClp} - ${t.discountClp} AND ${t.totalClp} >= 0`),
    index("idx_orders_student").on(t.studentId, t.createdAt),
    index("idx_orders_status").on(t.status, t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    kind: orderItemKind("kind").notNull(),
    planId: uuid("plan_id").references(() => plans.id),
    classSessionId: uuid("class_session_id").references(() => classSessions.id),
    /** Snapshot del nombre al momento de comprar. */
    description: text("description").notNull(),
    unitPriceClp: integer("unit_price_clp").notNull(),
    quantity: smallint("quantity").notNull().default(1),
    totalClp: integer("total_clp").notNull(),
  },
  (t) => [
    check(
      "ck_order_item_target",
      sql`(${t.kind} = 'plan' AND ${t.planId} IS NOT NULL) OR (${t.kind} = 'drop_in' AND ${t.classSessionId} IS NOT NULL)`,
    ),
    index("idx_order_items_order").on(t.orderId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id"),
    status: paymentStatus("status").notNull().default("created"),
    amountClp: integer("amount_clp").notNull(),
    redirectUrl: text("redirect_url"),
    paymentMethod: text("payment_method"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_payment_provider_id")
      .on(t.provider, t.providerPaymentId)
      .where(sql`${t.providerPaymentId} IS NOT NULL`),
    index("idx_payments_order").on(t.orderId),
  ],
);

/**
 * Bitácora de webhooks. El índice único (provider, event_id) es lo que hace
 * idempotente el reintento del proveedor: si el INSERT choca, no se reprocesa.
 */
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type"),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    signatureValid: boolean("signature_valid").notNull().default(false),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processError: text("process_error"),
  },
  (t) => [uniqueIndex("uq_payment_event").on(t.provider, t.eventId)],
);

export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  amountClp: integer("amount_clp").notNull(),
  reason: text("reason"),
  providerRefundId: text("provider_refund_id"),
  status: text("status").notNull().default("pending"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    discountClp: integer("discount_clp").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_redemption_order").on(t.orderId),
    index("idx_redemption_coupon_student").on(t.couponId, t.studentId),
  ],
);
