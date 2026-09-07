import { createRequire } from 'module'; const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema/enums.ts
import { pgEnum } from "drizzle-orm/pg-core";
var userRole, userStatus, discipline, classLevel, sessionStatus, reservationStatus, reservationSource, waitlistStatus, planSegment, membershipStatus, creditReason, orderStatus, orderItemKind, paymentStatus, couponType, campaignStatus, outboxStatus, leadStatus;
var init_enums = __esm({
  "shared/schema/enums.ts"() {
    "use strict";
    userRole = pgEnum("user_role", ["owner", "instructor", "student"]);
    userStatus = pgEnum("user_status", ["active", "inactive", "invited"]);
    discipline = pgEnum("discipline", [
      "apparatus",
      "mat",
      "barre",
      "dance",
      "prenatal",
      "senior",
      "bridal",
      "teacher_training"
    ]);
    classLevel = pgEnum("class_level", ["intro", "all_levels", "intermediate", "advanced"]);
    sessionStatus = pgEnum("session_status", ["scheduled", "cancelled", "completed"]);
    reservationStatus = pgEnum("reservation_status", [
      "booked",
      "attended",
      "no_show",
      "cancelled",
      "late_cancelled",
      "studio_cancelled"
    ]);
    reservationSource = pgEnum("reservation_source", ["web", "admin", "waitlist"]);
    waitlistStatus = pgEnum("waitlist_status", [
      "waiting",
      "offered",
      "promoted",
      "expired",
      "cancelled"
    ]);
    planSegment = pgEnum("plan_segment", ["adult", "student", "valle", "special"]);
    membershipStatus = pgEnum("membership_status", [
      "pending_verification",
      "active",
      "expired",
      "depleted",
      "cancelled"
    ]);
    creditReason = pgEnum("credit_reason", [
      "purchase",
      "booking",
      "cancellation_refund",
      "late_cancel_forfeit",
      "no_show_forfeit",
      "studio_cancel_refund",
      "admin_adjust",
      "expiration"
    ]);
    orderStatus = pgEnum("order_status", [
      "draft",
      "awaiting_payment",
      "paid",
      "failed",
      "expired",
      "cancelled",
      "refunded"
    ]);
    orderItemKind = pgEnum("order_item_kind", ["plan", "drop_in"]);
    paymentStatus = pgEnum("payment_status", [
      "created",
      "pending",
      "authorized",
      "paid",
      "failed",
      "refunded",
      "expired"
    ]);
    couponType = pgEnum("coupon_type", ["percent", "fixed"]);
    campaignStatus = pgEnum("campaign_status", [
      "draft",
      "scheduled",
      "sending",
      "sent",
      "cancelled"
    ]);
    outboxStatus = pgEnum("outbox_status", ["queued", "sending", "sent", "failed", "skipped"]);
    leadStatus = pgEnum("lead_status", ["new", "contacted", "converted", "discarded"]);
  }
});

// shared/schema/_types.ts
import { customType } from "drizzle-orm/pg-core";
var citext;
var init_types = __esm({
  "shared/schema/_types.ts"() {
    "use strict";
    citext = customType({
      dataType: () => "citext"
    });
  }
});

// shared/schema/identity.ts
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  inet,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
var users, studentProfiles, instructorProfiles, authSessions, passwordResetTokens, usersRelations;
var init_identity = __esm({
  "shared/schema/identity.ts"() {
    "use strict";
    init_types();
    init_enums();
    users = pgTable(
      "users",
      {
        id: uuid("id").primaryKey().defaultRandom(),
        email: citext("email").notNull(),
        /** NULL = alumna dada de alta por la dueña que todavía no fija su clave. */
        passwordHash: text("password_hash"),
        role: userRole("role").notNull().default("student"),
        firstName: text("first_name").notNull(),
        lastName: text("last_name").notNull(),
        phone: text("phone"),
        /** RUT normalizado sin puntos, con guion y DV. */
        rut: text("rut"),
        birthDate: date("birth_date"),
        status: userStatus("status").notNull().default("active"),
        emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        failedLoginCount: smallint("failed_login_count").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex("uq_users_email").on(t.email),
        uniqueIndex("uq_users_rut").on(t.rut).where(sql`${t.rut} IS NOT NULL`),
        index("idx_users_role_status").on(t.role, t.status)
      ]
    );
    studentProfiles = pgTable("student_profiles", {
      userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
      emergencyContactName: text("emergency_contact_name"),
      emergencyContactPhone: text("emergency_contact_phone"),
      healthNotes: text("health_notes"),
      isPregnant: boolean("is_pregnant").notNull().default(false),
      pregnancyDueDate: date("pregnancy_due_date"),
      goals: text("goals"),
      referralSource: text("referral_source"),
      marketingOptIn: boolean("marketing_opt_in").notNull().default(true),
      /** Sólo visible para la dueña. */
      internalNotes: text("internal_notes"),
      joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow()
    });
    instructorProfiles = pgTable("instructor_profiles", {
      userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
      bio: text("bio"),
      specialties: discipline("specialties").array(),
      /** Color hex para distinguirla en la grilla de la agenda. */
      calendarColor: text("calendar_color"),
      isActive: boolean("is_active").notNull().default(true),
      certifications: text("certifications")
    });
    authSessions = pgTable(
      "auth_sessions",
      {
        /** El valor de la cookie: 32 bytes aleatorios en base64url. */
        id: text("id").primaryKey(),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
        revokedAt: timestamp("revoked_at", { withTimezone: true }),
        ip: inet("ip"),
        userAgent: text("user_agent")
      },
      (t) => [index("idx_auth_sessions_user").on(t.userId), index("idx_auth_sessions_expires").on(t.expiresAt)]
    );
    passwordResetTokens = pgTable("password_reset_tokens", {
      /** sha256 del token que viaja por email; el token plano nunca se guarda. */
      tokenHash: text("token_hash").primaryKey(),
      userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      usedAt: timestamp("used_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    usersRelations = relations(users, ({ one }) => ({
      studentProfile: one(studentProfiles, {
        fields: [users.id],
        references: [studentProfiles.userId]
      }),
      instructorProfile: one(instructorProfiles, {
        fields: [users.id],
        references: [instructorProfiles.userId]
      })
    }));
  }
});

// shared/schema/catalog.ts
import { boolean as boolean2, integer, pgTable as pgTable2, smallint as smallint2, text as text2, timestamp as timestamp2, uniqueIndex as uniqueIndex2, uuid as uuid2 } from "drizzle-orm/pg-core";
var rooms, equipment, classTypes;
var init_catalog = __esm({
  "shared/schema/catalog.ts"() {
    "use strict";
    init_types();
    init_enums();
    rooms = pgTable2(
      "rooms",
      {
        id: uuid2("id").primaryKey().defaultRandom(),
        name: text2("name").notNull(),
        capacity: smallint2("capacity").notNull(),
        description: text2("description"),
        /** Preparado para multi-sede sin migración: hoy todas comparten dirección. */
        location: text2("location"),
        isActive: boolean2("is_active").notNull().default(true),
        createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [uniqueIndex2("uq_rooms_name").on(t.name)]
    );
    equipment = pgTable2(
      "equipment",
      {
        id: uuid2("id").primaryKey().defaultRandom(),
        roomId: uuid2("room_id").notNull().references(() => rooms.id, { onDelete: "cascade" }),
        kind: text2("kind").notNull(),
        code: text2("code").notNull(),
        isOperational: boolean2("is_operational").notNull().default(true),
        notes: text2("notes")
      },
      (t) => [uniqueIndex2("uq_equipment_room_code").on(t.roomId, t.code)]
    );
    classTypes = pgTable2(
      "class_types",
      {
        id: uuid2("id").primaryKey().defaultRandom(),
        slug: citext("slug").notNull(),
        name: text2("name").notNull(),
        shortDescription: text2("short_description"),
        description: text2("description"),
        discipline: discipline("discipline").notNull(),
        level: classLevel("level").notNull().default("all_levels"),
        defaultDurationMin: smallint2("default_duration_min").notNull().default(60),
        defaultCapacity: smallint2("default_capacity").notNull(),
        /** Precio de la clase suelta, en pesos enteros. */
        dropInPriceClp: integer("drop_in_price_clp").notNull(),
        color: text2("color"),
        imageUrl: text2("image_url"),
        isPublic: boolean2("is_public").notNull().default(true),
        isActive: boolean2("is_active").notNull().default(true),
        sortOrder: smallint2("sort_order").notNull().default(0),
        createdAt: timestamp2("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [uniqueIndex2("uq_class_types_slug").on(t.slug)]
    );
  }
});

// shared/schema/scheduling.ts
import { sql as sql2 } from "drizzle-orm";
import {
  boolean as boolean3,
  check,
  date as date2,
  index as index2,
  pgTable as pgTable3,
  smallint as smallint3,
  text as text3,
  time,
  timestamp as timestamp3,
  uniqueIndex as uniqueIndex3,
  uuid as uuid3
} from "drizzle-orm/pg-core";
var classTemplates, classSessions;
var init_scheduling = __esm({
  "shared/schema/scheduling.ts"() {
    "use strict";
    init_catalog();
    init_enums();
    init_identity();
    classTemplates = pgTable3(
      "class_templates",
      {
        id: uuid3("id").primaryKey().defaultRandom(),
        classTypeId: uuid3("class_type_id").notNull().references(() => classTypes.id),
        instructorId: uuid3("instructor_id").references(() => users.id),
        roomId: uuid3("room_id").notNull().references(() => rooms.id),
        /** 0 = domingo .. 6 = sábado, en hora local de Santiago. */
        weekday: smallint3("weekday").notNull(),
        /** Hora de pared local, NO un instante. El instante se calcula al materializar. */
        startTime: time("start_time").notNull(),
        durationMin: smallint3("duration_min").notNull().default(60),
        capacity: smallint3("capacity").notNull(),
        effectiveFrom: date2("effective_from").notNull(),
        /** NULL = vigencia indefinida. */
        effectiveTo: date2("effective_to"),
        timezone: text3("timezone").notNull().default("America/Santiago"),
        /** Última fecha ya materializada; hace el job idempotente y barato. */
        materializedThrough: date2("materialized_through"),
        isActive: boolean3("is_active").notNull().default(true),
        createdAt: timestamp3("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp3("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        check("ck_template_weekday", sql2`${t.weekday} BETWEEN 0 AND 6`),
        check("ck_template_capacity", sql2`${t.capacity} > 0`),
        check("ck_template_range", sql2`${t.effectiveTo} IS NULL OR ${t.effectiveTo} >= ${t.effectiveFrom}`),
        index2("idx_templates_weekday").on(t.weekday, t.startTime)
      ]
    );
    classSessions = pgTable3(
      "class_sessions",
      {
        id: uuid3("id").primaryKey().defaultRandom(),
        /** NULL = clase puntual creada a mano, fuera de toda plantilla. */
        templateId: uuid3("template_id").references(() => classTemplates.id, { onDelete: "set null" }),
        classTypeId: uuid3("class_type_id").notNull().references(() => classTypes.id),
        instructorId: uuid3("instructor_id").references(() => users.id),
        roomId: uuid3("room_id").notNull().references(() => rooms.id),
        /** Fecha en Santiago. Junto con startTime define starts_at. */
        localDate: date2("local_date").notNull(),
        startTime: time("start_time").notNull(),
        startsAt: timestamp3("starts_at", { withTimezone: true }).notNull(),
        endsAt: timestamp3("ends_at", { withTimezone: true }).notNull(),
        durationMin: smallint3("duration_min").notNull(),
        capacity: smallint3("capacity").notNull(),
        /** Denormalizado a propósito: es la fuente de verdad de los cupos y el punto
         *  donde se serializa la concurrencia (ver server/sql/bookSpot.sql.ts). */
        bookedCount: smallint3("booked_count").notNull().default(0),
        waitlistCount: smallint3("waitlist_count").notNull().default(0),
        status: sessionStatus("status").notNull().default("scheduled"),
        cancelledAt: timestamp3("cancelled_at", { withTimezone: true }),
        cancelledBy: uuid3("cancelled_by").references(() => users.id),
        cancellationReason: text3("cancellation_reason"),
        notes: text3("notes"),
        createdAt: timestamp3("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp3("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        /** Red de seguridad final contra el overbooking, incluso si alguien escribe por fuera. */
        check("ck_session_booked_within_capacity", sql2`${t.bookedCount} >= 0 AND ${t.bookedCount} <= ${t.capacity}`),
        check("ck_session_capacity", sql2`${t.capacity} > 0`),
        check("ck_session_waitlist", sql2`${t.waitlistCount} >= 0`),
        /** Hace la materialización idempotente: re-correr el job no duplica clases. */
        uniqueIndex3("uq_session_template_date").on(t.templateId, t.localDate),
        index2("idx_sessions_starts").on(t.startsAt),
        index2("idx_sessions_date_status").on(t.localDate, t.status),
        index2("idx_sessions_instructor").on(t.instructorId, t.startsAt),
        index2("idx_sessions_type").on(t.classTypeId, t.startsAt)
      ]
    );
  }
});

// shared/schema/memberships.ts
import { sql as sql3 } from "drizzle-orm";
import {
  bigserial,
  boolean as boolean4,
  check as check2,
  date as date3,
  index as index3,
  integer as integer2,
  pgTable as pgTable4,
  primaryKey,
  smallint as smallint4,
  text as text4,
  time as time2,
  timestamp as timestamp4,
  uniqueIndex as uniqueIndex4,
  uuid as uuid4
} from "drizzle-orm/pg-core";
var plans, planClassTypes, memberships, creditTransactions;
var init_memberships = __esm({
  "shared/schema/memberships.ts"() {
    "use strict";
    init_types();
    init_catalog();
    init_enums();
    init_identity();
    plans = pgTable4(
      "plans",
      {
        id: uuid4("id").primaryKey().defaultRandom(),
        slug: citext("slug").notNull(),
        name: text4("name").notNull(),
        description: text4("description"),
        segment: planSegment("segment").notNull(),
        /** 1 = mensual, 3 = trimestral, 6 = semestral, 12 = anual. */
        periodMonths: smallint4("period_months").notNull().default(1),
        credits: integer2("credits").notNull(),
        priceClp: integer2("price_clp").notNull(),
        /** Días de vigencia desde la activación. */
        validityDays: smallint4("validity_days").notNull(),
        /** Plan estudiante: exige certificado de alumno regular aprobado por la dueña. */
        requiresVerification: boolean4("requires_verification").notNull().default(false),
        /** Clase suelta: habilita el flujo de compra con reserva en espera de pago. */
        isDropIn: boolean4("is_drop_in").notNull().default(false),
        /* --- Restricción de horario (planes valle) ---
           NULL en los tres campos = sin restricción. El plan valle sólo permite
           gastar créditos de lunes a viernes entre las 15:00 y las 17:59. */
        allowedWeekdays: smallint4("allowed_weekdays").array(),
        allowedTimeFrom: time2("allowed_time_from"),
        allowedTimeTo: time2("allowed_time_to"),
        maxBookingsPerDay: smallint4("max_bookings_per_day").notNull().default(1),
        isPublic: boolean4("is_public").notNull().default(true),
        isActive: boolean4("is_active").notNull().default(true),
        sortOrder: smallint4("sort_order").notNull().default(0),
        badge: text4("badge"),
        createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex4("uq_plans_slug").on(t.slug),
        check2("ck_plans_credits", sql3`${t.credits} >= 1`),
        check2("ck_plans_price", sql3`${t.priceClp} >= 0`),
        check2("ck_plans_validity", sql3`${t.validityDays} >= 1`),
        index3("idx_plans_public").on(t.isPublic, t.sortOrder)
      ]
    );
    planClassTypes = pgTable4(
      "plan_class_types",
      {
        planId: uuid4("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
        classTypeId: uuid4("class_type_id").notNull().references(() => classTypes.id, { onDelete: "cascade" })
      },
      (t) => [primaryKey({ columns: [t.planId, t.classTypeId] })]
    );
    memberships = pgTable4(
      "memberships",
      {
        id: uuid4("id").primaryKey().defaultRandom(),
        studentId: uuid4("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        planId: uuid4("plan_id").notNull().references(() => plans.id),
        orderId: uuid4("order_id"),
        status: membershipStatus("status").notNull().default("pending_verification"),
        creditsTotal: integer2("credits_total").notNull(),
        creditsUsed: integer2("credits_used").notNull().default(0),
        startsOn: date3("starts_on").notNull(),
        /** Inclusive: la membresía vale hasta el final de este día. */
        endsOn: date3("ends_on").notNull(),
        activatedAt: timestamp4("activated_at", { withTimezone: true }),
        cancelledAt: timestamp4("cancelled_at", { withTimezone: true }),
        depletedAt: timestamp4("depleted_at", { withTimezone: true }),
        /** Histórico: si mañana sube el precio del plan, lo pagado no cambia. */
        pricePaidClp: integer2("price_paid_clp").notNull().default(0),
        /** Certificado de alumno regular, para planes de segmento estudiante. */
        verificationNote: text4("verification_note"),
        verifiedBy: uuid4("verified_by").references(() => users.id),
        verifiedAt: timestamp4("verified_at", { withTimezone: true }),
        createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp4("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        /** Impide gastar créditos que no existen, aun bajo concurrencia. */
        check2("ck_membership_credits", sql3`${t.creditsUsed} >= 0 AND ${t.creditsUsed} <= ${t.creditsTotal}`),
        check2("ck_membership_dates", sql3`${t.endsOn} >= ${t.startsOn}`),
        index3("idx_memberships_student_status").on(t.studentId, t.status),
        index3("idx_memberships_ends").on(t.endsOn)
      ]
    );
    creditTransactions = pgTable4(
      "credit_transactions",
      {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        membershipId: uuid4("membership_id").notNull().references(() => memberships.id, { onDelete: "cascade" }),
        studentId: uuid4("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        /** Negativo = consumo, positivo = devolución. 0 = marca (pérdida por no-show). */
        delta: integer2("delta").notNull(),
        reason: creditReason("reason").notNull(),
        reservationId: uuid4("reservation_id"),
        orderId: uuid4("order_id"),
        balanceAfter: integer2("balance_after"),
        note: text4("note"),
        createdBy: uuid4("created_by").references(() => users.id),
        createdAt: timestamp4("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        /** Un doble click no puede devolver dos veces el mismo crédito. */
        uniqueIndex4("uq_credit_tx_idem").on(t.reservationId, t.reason).where(sql3`${t.reservationId} IS NOT NULL`),
        index3("idx_credit_tx_membership").on(t.membershipId, t.createdAt)
      ]
    );
  }
});

// shared/schema/bookings.ts
import { sql as sql4 } from "drizzle-orm";
import {
  boolean as boolean5,
  index as index4,
  pgTable as pgTable5,
  text as text5,
  timestamp as timestamp5,
  uniqueIndex as uniqueIndex5,
  uuid as uuid5
} from "drizzle-orm/pg-core";
var reservations, waitlistEntries;
var init_bookings = __esm({
  "shared/schema/bookings.ts"() {
    "use strict";
    init_enums();
    init_identity();
    init_memberships();
    init_scheduling();
    reservations = pgTable5(
      "reservations",
      {
        id: uuid5("id").primaryKey().defaultRandom(),
        sessionId: uuid5("session_id").notNull().references(() => classSessions.id, { onDelete: "cascade" }),
        studentId: uuid5("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        /** NULL mientras es una clase suelta con pago pendiente. */
        membershipId: uuid5("membership_id").references(() => memberships.id),
        orderId: uuid5("order_id"),
        status: reservationStatus("status").notNull().default("booked"),
        source: reservationSource("source").notNull().default("web"),
        /** Si consumió un crédito de la membresía (determina si hay algo que devolver). */
        creditCharged: boolean5("credit_charged").notNull().default(false),
        bookedAt: timestamp5("booked_at", { withTimezone: true }).notNull().defaultNow(),
        cancelledAt: timestamp5("cancelled_at", { withTimezone: true }),
        cancelledBy: uuid5("cancelled_by").references(() => users.id),
        checkedInAt: timestamp5("checked_in_at", { withTimezone: true }),
        markedBy: uuid5("marked_by").references(() => users.id),
        notes: text5("notes"),
        createdAt: timestamp5("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp5("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        /**
         * Impide la doble reserva, pero permite volver a reservar tras cancelar
         * (los estados cancelados quedan fuera del índice).
         */
        uniqueIndex5("uq_reservation_active").on(t.sessionId, t.studentId).where(sql4`${t.status} IN ('booked','attended','no_show')`),
        index4("idx_res_session_status").on(t.sessionId, t.status),
        index4("idx_res_student").on(t.studentId, t.bookedAt),
        index4("idx_res_membership").on(t.membershipId)
      ]
    );
    waitlistEntries = pgTable5(
      "waitlist_entries",
      {
        id: uuid5("id").primaryKey().defaultRandom(),
        sessionId: uuid5("session_id").notNull().references(() => classSessions.id, { onDelete: "cascade" }),
        studentId: uuid5("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        status: waitlistStatus("status").notNull().default("waiting"),
        /** Si es true, al liberarse un cupo se reserva automáticamente. */
        autoBook: boolean5("auto_book").notNull().default(true),
        offeredAt: timestamp5("offered_at", { withTimezone: true }),
        offerExpiresAt: timestamp5("offer_expires_at", { withTimezone: true }),
        notifiedAt: timestamp5("notified_at", { withTimezone: true }),
        promotedAt: timestamp5("promoted_at", { withTimezone: true }),
        reservationId: uuid5("reservation_id").references(() => reservations.id),
        expiredReason: text5("expired_reason"),
        createdAt: timestamp5("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex5("uq_waitlist_active").on(t.sessionId, t.studentId).where(sql4`${t.status} IN ('waiting','offered')`),
        index4("idx_waitlist_fifo").on(t.sessionId, t.createdAt)
      ]
    );
  }
});

// shared/schema/commerce.ts
import { sql as sql5 } from "drizzle-orm";
import {
  bigserial as bigserial2,
  boolean as boolean6,
  check as check3,
  index as index5,
  integer as integer3,
  jsonb,
  pgTable as pgTable6,
  primaryKey as primaryKey2,
  smallint as smallint5,
  text as text6,
  timestamp as timestamp6,
  uniqueIndex as uniqueIndex6,
  uuid as uuid6
} from "drizzle-orm/pg-core";
var coupons, couponPlans, orders, orderItems, payments, paymentEvents, refunds, couponRedemptions;
var init_commerce = __esm({
  "shared/schema/commerce.ts"() {
    "use strict";
    init_types();
    init_enums();
    init_identity();
    init_memberships();
    init_scheduling();
    coupons = pgTable6(
      "coupons",
      {
        id: uuid6("id").primaryKey().defaultRandom(),
        code: citext("code").notNull(),
        description: text6("description"),
        type: couponType("type").notNull(),
        /** percent: 1..100 · fixed: pesos enteros. */
        value: integer3("value").notNull(),
        minAmountClp: integer3("min_amount_clp").notNull().default(0),
        maxRedemptions: integer3("max_redemptions"),
        redemptionsCount: integer3("redemptions_count").notNull().default(0),
        perStudentLimit: smallint5("per_student_limit").notNull().default(1),
        startsAt: timestamp6("starts_at", { withTimezone: true }),
        endsAt: timestamp6("ends_at", { withTimezone: true }),
        isActive: boolean6("is_active").notNull().default(true),
        createdBy: uuid6("created_by").references(() => users.id),
        createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex6("uq_coupons_code").on(t.code),
        check3(
          "ck_coupon_value",
          sql5`(${t.type} = 'percent' AND ${t.value} BETWEEN 1 AND 100) OR (${t.type} = 'fixed' AND ${t.value} > 0)`
        ),
        /** Cierra la carrera por el último canje disponible. */
        check3("ck_coupon_redemptions", sql5`${t.maxRedemptions} IS NULL OR ${t.redemptionsCount} <= ${t.maxRedemptions}`)
      ]
    );
    couponPlans = pgTable6(
      "coupon_plans",
      {
        couponId: uuid6("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
        planId: uuid6("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" })
      },
      (t) => [primaryKey2({ columns: [t.couponId, t.planId] })]
    );
    orders = pgTable6(
      "orders",
      {
        id: uuid6("id").primaryKey().defaultRandom(),
        /** Referencia legible que viaja a la pasarela: PP-2026-000123. */
        orderNumber: text6("order_number").notNull(),
        studentId: uuid6("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        status: orderStatus("status").notNull().default("draft"),
        subtotalClp: integer3("subtotal_clp").notNull().default(0),
        discountClp: integer3("discount_clp").notNull().default(0),
        totalClp: integer3("total_clp").notNull().default(0),
        couponId: uuid6("coupon_id").references(() => coupons.id),
        provider: text6("provider"),
        idempotencyKey: text6("idempotency_key"),
        /** Vence el hold del cupo de una clase suelta (30 min). */
        expiresAt: timestamp6("expires_at", { withTimezone: true }),
        paidAt: timestamp6("paid_at", { withTimezone: true }),
        metadata: jsonb("metadata"),
        createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp6("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex6("uq_orders_number").on(t.orderNumber),
        uniqueIndex6("uq_orders_idempotency").on(t.idempotencyKey).where(sql5`${t.idempotencyKey} IS NOT NULL`),
        check3("ck_order_totals", sql5`${t.totalClp} = ${t.subtotalClp} - ${t.discountClp} AND ${t.totalClp} >= 0`),
        index5("idx_orders_student").on(t.studentId, t.createdAt),
        index5("idx_orders_status").on(t.status, t.createdAt)
      ]
    );
    orderItems = pgTable6(
      "order_items",
      {
        id: uuid6("id").primaryKey().defaultRandom(),
        orderId: uuid6("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
        kind: orderItemKind("kind").notNull(),
        planId: uuid6("plan_id").references(() => plans.id),
        classSessionId: uuid6("class_session_id").references(() => classSessions.id),
        /** Snapshot del nombre al momento de comprar. */
        description: text6("description").notNull(),
        unitPriceClp: integer3("unit_price_clp").notNull(),
        quantity: smallint5("quantity").notNull().default(1),
        totalClp: integer3("total_clp").notNull()
      },
      (t) => [
        check3(
          "ck_order_item_target",
          sql5`(${t.kind} = 'plan' AND ${t.planId} IS NOT NULL) OR (${t.kind} = 'drop_in' AND ${t.classSessionId} IS NOT NULL)`
        ),
        index5("idx_order_items_order").on(t.orderId)
      ]
    );
    payments = pgTable6(
      "payments",
      {
        id: uuid6("id").primaryKey().defaultRandom(),
        orderId: uuid6("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
        provider: text6("provider").notNull(),
        providerPaymentId: text6("provider_payment_id"),
        status: paymentStatus("status").notNull().default("created"),
        amountClp: integer3("amount_clp").notNull(),
        redirectUrl: text6("redirect_url"),
        paymentMethod: text6("payment_method"),
        paidAt: timestamp6("paid_at", { withTimezone: true }),
        failureReason: text6("failure_reason"),
        raw: jsonb("raw"),
        createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp6("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex6("uq_payment_provider_id").on(t.provider, t.providerPaymentId).where(sql5`${t.providerPaymentId} IS NOT NULL`),
        index5("idx_payments_order").on(t.orderId)
      ]
    );
    paymentEvents = pgTable6(
      "payment_events",
      {
        id: bigserial2("id", { mode: "number" }).primaryKey(),
        provider: text6("provider").notNull(),
        eventId: text6("event_id").notNull(),
        eventType: text6("event_type"),
        paymentId: uuid6("payment_id").references(() => payments.id, { onDelete: "set null" }),
        signatureValid: boolean6("signature_valid").notNull().default(false),
        payload: jsonb("payload"),
        receivedAt: timestamp6("received_at", { withTimezone: true }).notNull().defaultNow(),
        processedAt: timestamp6("processed_at", { withTimezone: true }),
        processError: text6("process_error")
      },
      (t) => [uniqueIndex6("uq_payment_event").on(t.provider, t.eventId)]
    );
    refunds = pgTable6("refunds", {
      id: uuid6("id").primaryKey().defaultRandom(),
      paymentId: uuid6("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
      amountClp: integer3("amount_clp").notNull(),
      reason: text6("reason"),
      providerRefundId: text6("provider_refund_id"),
      status: text6("status").notNull().default("pending"),
      createdBy: uuid6("created_by").references(() => users.id),
      createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    couponRedemptions = pgTable6(
      "coupon_redemptions",
      {
        id: uuid6("id").primaryKey().defaultRandom(),
        couponId: uuid6("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
        orderId: uuid6("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
        studentId: uuid6("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        discountClp: integer3("discount_clp").notNull(),
        createdAt: timestamp6("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex6("uq_redemption_order").on(t.orderId),
        index5("idx_redemption_coupon_student").on(t.couponId, t.studentId)
      ]
    );
  }
});

// shared/schema/messaging.ts
import { sql as sql6 } from "drizzle-orm";
import {
  bigserial as bigserial3,
  boolean as boolean7,
  index as index6,
  integer as integer4,
  jsonb as jsonb2,
  pgTable as pgTable7,
  smallint as smallint6,
  text as text7,
  timestamp as timestamp7,
  uniqueIndex as uniqueIndex7,
  uuid as uuid7
} from "drizzle-orm/pg-core";
var emailTemplates, emailCampaigns, emailOutbox, contactLeads;
var init_messaging = __esm({
  "shared/schema/messaging.ts"() {
    "use strict";
    init_types();
    init_enums();
    init_identity();
    emailTemplates = pgTable7(
      "email_templates",
      {
        id: uuid7("id").primaryKey().defaultRandom(),
        key: citext("key").notNull(),
        name: text7("name").notNull(),
        subject: text7("subject").notNull(),
        htmlBody: text7("html_body").notNull(),
        textBody: text7("text_body"),
        /** Variables de ejemplo para la previsualización del editor. */
        sampleVars: jsonb2("sample_vars"),
        isActive: boolean7("is_active").notNull().default(true),
        updatedBy: uuid7("updated_by").references(() => users.id),
        updatedAt: timestamp7("updated_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [uniqueIndex7("uq_email_templates_key").on(t.key)]
    );
    emailCampaigns = pgTable7("email_campaigns", {
      id: uuid7("id").primaryKey().defaultRandom(),
      name: text7("name").notNull(),
      subject: text7("subject").notNull(),
      htmlBody: text7("html_body").notNull(),
      /** { membership: 'active'|'expiring'|'expired'|'none', inactiveDays: n, marketingOptIn: true } */
      audienceFilter: jsonb2("audience_filter"),
      status: campaignStatus("status").notNull().default("draft"),
      scheduledAt: timestamp7("scheduled_at", { withTimezone: true }),
      sentAt: timestamp7("sent_at", { withTimezone: true }),
      recipientsCount: integer4("recipients_count").notNull().default(0),
      createdBy: uuid7("created_by").references(() => users.id),
      createdAt: timestamp7("created_at", { withTimezone: true }).notNull().defaultNow()
    });
    emailOutbox = pgTable7(
      "email_outbox",
      {
        id: bigserial3("id", { mode: "number" }).primaryKey(),
        toEmail: citext("to_email").notNull(),
        toUserId: uuid7("to_user_id").references(() => users.id, { onDelete: "set null" }),
        subject: text7("subject").notNull(),
        htmlBody: text7("html_body").notNull(),
        textBody: text7("text_body"),
        templateKey: text7("template_key"),
        campaignId: uuid7("campaign_id").references(() => emailCampaigns.id, { onDelete: "cascade" }),
        status: outboxStatus("status").notNull().default("queued"),
        attempts: smallint6("attempts").notNull().default(0),
        scheduledFor: timestamp7("scheduled_for", { withTimezone: true }).notNull().defaultNow(),
        lockedAt: timestamp7("locked_at", { withTimezone: true }),
        sentAt: timestamp7("sent_at", { withTimezone: true }),
        lastError: text7("last_error"),
        providerMessageId: text7("provider_message_id"),
        /** p.ej. "session_cancel:<sessionId>:<userId>" — evita duplicados si el cron corre dos veces. */
        dedupeKey: text7("dedupe_key"),
        createdAt: timestamp7("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        uniqueIndex7("uq_outbox_dedupe").on(t.dedupeKey).where(sql6`${t.dedupeKey} IS NOT NULL`),
        index6("idx_outbox_pending").on(t.status, t.scheduledFor),
        index6("idx_outbox_campaign").on(t.campaignId)
      ]
    );
    contactLeads = pgTable7("contact_leads", {
      id: uuid7("id").primaryKey().defaultRandom(),
      name: text7("name").notNull(),
      email: citext("email").notNull(),
      phone: text7("phone"),
      message: text7("message"),
      interest: text7("interest"),
      status: leadStatus("status").notNull().default("new"),
      createdAt: timestamp7("created_at", { withTimezone: true }).notNull().defaultNow()
    });
  }
});

// shared/schema/system.ts
import { bigserial as bigserial4, index as index7, inet as inet2, jsonb as jsonb3, pgTable as pgTable8, text as text8, timestamp as timestamp8, uuid as uuid8 } from "drizzle-orm/pg-core";
var auditLog, settings;
var init_system = __esm({
  "shared/schema/system.ts"() {
    "use strict";
    init_identity();
    auditLog = pgTable8(
      "audit_log",
      {
        id: bigserial4("id", { mode: "number" }).primaryKey(),
        actorUserId: uuid8("actor_user_id").references(() => users.id, { onDelete: "set null" }),
        actorRole: text8("actor_role"),
        /** "reservation.cancel", "membership.credits.adjust", "session.cancel". */
        action: text8("action").notNull(),
        entityType: text8("entity_type"),
        entityId: uuid8("entity_id"),
        /** Resumen legible en español, para mostrarlo tal cual en la UI. */
        summary: text8("summary"),
        diff: jsonb3("diff"),
        ip: inet2("ip"),
        userAgent: text8("user_agent"),
        createdAt: timestamp8("created_at", { withTimezone: true }).notNull().defaultNow()
      },
      (t) => [
        index7("idx_audit_entity").on(t.entityType, t.entityId, t.createdAt),
        index7("idx_audit_actor").on(t.actorUserId, t.createdAt),
        index7("idx_audit_created").on(t.createdAt)
      ]
    );
    settings = pgTable8("settings", {
      key: text8("key").primaryKey(),
      value: jsonb3("value").notNull(),
      updatedBy: uuid8("updated_by").references(() => users.id),
      updatedAt: timestamp8("updated_at", { withTimezone: true }).notNull().defaultNow()
    });
  }
});

// shared/schema/index.ts
var schema_exports = {};
__export(schema_exports, {
  auditLog: () => auditLog,
  authSessions: () => authSessions,
  campaignStatus: () => campaignStatus,
  classLevel: () => classLevel,
  classSessions: () => classSessions,
  classTemplates: () => classTemplates,
  classTypes: () => classTypes,
  contactLeads: () => contactLeads,
  couponPlans: () => couponPlans,
  couponRedemptions: () => couponRedemptions,
  couponType: () => couponType,
  coupons: () => coupons,
  creditReason: () => creditReason,
  creditTransactions: () => creditTransactions,
  discipline: () => discipline,
  emailCampaigns: () => emailCampaigns,
  emailOutbox: () => emailOutbox,
  emailTemplates: () => emailTemplates,
  equipment: () => equipment,
  instructorProfiles: () => instructorProfiles,
  leadStatus: () => leadStatus,
  membershipStatus: () => membershipStatus,
  memberships: () => memberships,
  orderItemKind: () => orderItemKind,
  orderItems: () => orderItems,
  orderStatus: () => orderStatus,
  orders: () => orders,
  outboxStatus: () => outboxStatus,
  passwordResetTokens: () => passwordResetTokens,
  paymentEvents: () => paymentEvents,
  paymentStatus: () => paymentStatus,
  payments: () => payments,
  planClassTypes: () => planClassTypes,
  planSegment: () => planSegment,
  plans: () => plans,
  refunds: () => refunds,
  reservationSource: () => reservationSource,
  reservationStatus: () => reservationStatus,
  reservations: () => reservations,
  rooms: () => rooms,
  sessionStatus: () => sessionStatus,
  settings: () => settings,
  studentProfiles: () => studentProfiles,
  userRole: () => userRole,
  userStatus: () => userStatus,
  users: () => users,
  usersRelations: () => usersRelations,
  waitlistEntries: () => waitlistEntries,
  waitlistStatus: () => waitlistStatus
});
var init_schema = __esm({
  "shared/schema/index.ts"() {
    "use strict";
    init_enums();
    init_identity();
    init_catalog();
    init_scheduling();
    init_memberships();
    init_bookings();
    init_commerce();
    init_messaging();
    init_system();
  }
});

// server/env.ts
import { z } from "zod";
function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variables de entorno inv\xE1lidas:
${detail}`);
  }
  cached = parsed.data;
  return cached;
}
function appUrl() {
  const e = env();
  if (e.APP_URL) return e.APP_URL.replace(/\/$/, "");
  if (e.VERCEL_URL) return `https://${e.VERCEL_URL}`;
  return `http://localhost:${e.PORT}`;
}
var schema, cached, isProd;
var init_env = __esm({
  "server/env.ts"() {
    "use strict";
    schema = z.object({
      DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
      SESSION_SECRET: z.string().min(8).default("dev-session-secret"),
      APP_URL: z.string().url().optional(),
      NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
      PORT: z.coerce.number().default(3001),
      VERCEL_URL: z.string().optional(),
      /** Pasarela de pago activa. "mock" hasta que Javiera defina la real. */
      PAYMENTS_PROVIDER: z.enum(["mock", "mercadopago", "flow", "transbank"]).default("mock"),
      /** Firma HMAC del pagador simulado. Cambiar en producción cuando se configure. */
      MOCK_WEBHOOK_SECRET: z.string().min(8).default("dev-mock-webhook-secret")
    });
    cached = null;
    isProd = () => env().NODE_ENV === "production";
  }
});

// server/db/client.ts
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
function build() {
  if (isNeon) {
    return drizzleHttp(neon(url), { schema: schema_exports, casing: "snake_case" });
  }
  const pool = new Pool({ connectionString: url, max: 5 });
  return drizzleNode(pool, { schema: schema_exports, casing: "snake_case" });
}
var url, isNeon, globalForDb, db, usingNeon;
var init_client = __esm({
  "server/db/client.ts"() {
    "use strict";
    init_schema();
    init_env();
    url = env().DATABASE_URL;
    isNeon = /neon\.tech/i.test(url);
    globalForDb = globalThis;
    db = globalForDb.__ppDb ?? build();
    if (!globalForDb.__ppDb) globalForDb.__ppDb = db;
    usingNeon = isNeon;
  }
});

// shared/domain/policy.ts
var DEFAULT_SETTINGS, STUDIO;
var init_policy = __esm({
  "shared/domain/policy.ts"() {
    "use strict";
    DEFAULT_SETTINGS = {
      businessKnowledge: { infoGeneral: "", preguntasFrecuentes: [] }
    };
    STUDIO = {
      name: "Pink Pilates",
      tagline: "Pink, Unleashed",
      email: "info@pinkpilates.cl",
      phone: "+56999471471",
      instagram: "@pinkpilates",
      address: "Angamos 326, Re\xF1aca / Vi\xF1a del Mar"
    };
  }
});

// server/services/settings.service.ts
var settings_service_exports = {};
__export(settings_service_exports, {
  getSetting: () => getSetting,
  getSettings: () => getSettings
});
import { inArray } from "drizzle-orm";
async function getSettings() {
  const rows = await db.select().from(settings);
  const out = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in DEFAULT_SETTINGS) out[row.key] = row.value;
  }
  return out;
}
async function getSetting(key) {
  const rows = await db.select().from(settings).where(inArray(settings.key, [key]));
  return rows[0]?.value ?? DEFAULT_SETTINGS[key];
}
var init_settings_service = __esm({
  "server/services/settings.service.ts"() {
    "use strict";
    init_policy();
    init_client();
    init_schema();
  }
});

// server/app.ts
import express from "express";

// server/middleware/errorHandler.ts
import { ZodError } from "zod";

// shared/domain/errors.ts
var STATUS = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  SESSION_FULL: 409,
  SESSION_CLOSED: 409,
  SESSION_CANCELLED: 409,
  ALREADY_BOOKED: 409,
  NO_ACTIVE_PLAN: 402,
  PLAN_NOT_APPLICABLE: 403,
  PLAN_TIME_RESTRICTED: 403,
  NO_CREDITS: 402,
  DAILY_LIMIT: 409,
  LATE_CANCEL: 409,
  TOO_LATE_TO_CANCEL: 409,
  NOT_ON_WAITLIST: 404,
  COUPON_INVALID: 422,
  ORDER_EXPIRED: 409,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500
};
var DomainError = class extends Error {
  code;
  status;
  details;
  constructor(code, message, details) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
};
var fail = (code, message, details) => {
  throw new DomainError(code, message, details);
};

// server/middleware/errorHandler.ts
function unwrapPg(err) {
  let current = err;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current.code === "string") return current;
    current = current.cause;
  }
  return {};
}
function notFound(_req, res) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado." } });
}
function errorHandler(err, _req, res, _next) {
  if (err instanceof DomainError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details }
    });
  }
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION",
        message: "Los datos enviados no son v\xE1lidos.",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
      }
    });
  }
  const pg = unwrapPg(err);
  if (pg?.code === "23505") {
    if (pg.constraint === "uq_reservation_active") {
      return res.status(409).json({
        error: { code: "ALREADY_BOOKED", message: "Ya tienes una reserva en esta clase." }
      });
    }
    return res.status(409).json({
      error: { code: "CONFLICT", message: "Ese registro ya existe." }
    });
  }
  if (pg?.code === "23514" && pg.constraint === "ck_session_booked_within_capacity") {
    return res.status(409).json({
      error: { code: "SESSION_FULL", message: "La clase acaba de llenarse." }
    });
  }
  if (pg?.code === "23P01") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "Ya hay otra clase en esa sala a esa hora." }
    });
  }
  console.error("[error]", err);
  return res.status(500).json({
    error: { code: "INTERNAL", message: "Ocurri\xF3 un error inesperado." }
  });
}
var wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// server/routes/index.ts
init_client();
import { sql as sql11 } from "drizzle-orm";

// server/middleware/session.ts
init_schema();
init_client();
init_env();
import { and, eq, gt, isNull } from "drizzle-orm";
var SESSION_COOKIE = "pp_session";
var THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1e3;
function serializeCookie(value, maxAgeSeconds) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  if (isProd()) parts.push("Secure");
  return parts.join("; ");
}
function readCookie(header, name) {
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return void 0;
}
function setSessionCookie(res, sessionId) {
  res.setHeader("Set-Cookie", serializeCookie(sessionId, THIRTY_DAYS_MS / 1e3));
}
function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", serializeCookie("", 0));
}
var sessionExpiry = () => new Date(Date.now() + THIRTY_DAYS_MS);
async function loadSession(req, _res, next) {
  try {
    const header = req.headers.cookie;
    if (!header) return next();
    const sid = readCookie(header, SESSION_COOKIE);
    if (!sid) return next();
    const [row] = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status
    }).from(authSessions).innerJoin(users, eq(users.id, authSessions.userId)).where(
      and(
        eq(authSessions.id, sid),
        isNull(authSessions.revokedAt),
        gt(authSessions.expiresAt, /* @__PURE__ */ new Date())
      )
    ).limit(1);
    if (row && row.status === "active") {
      req.user = {
        id: row.id,
        email: row.email,
        role: row.role,
        firstName: row.firstName,
        lastName: row.lastName
      };
      req.sessionId = sid;
    }
    next();
  } catch (err) {
    next(err);
  }
}

// server/routes/auth.routes.ts
import { Router } from "express";
import { eq as eq3 } from "drizzle-orm";

// shared/dto/auth.dto.ts
import { z as z2 } from "zod";
var phone = z2.string().trim().transform((v) => v.replace(/[\s-]/g, "")).refine((v) => /^\+?56\d{9}$/.test(v) || /^9\d{8}$/.test(v), "Tel\xE9fono chileno inv\xE1lido").transform((v) => v.startsWith("+") ? v : v.startsWith("56") ? `+${v}` : `+56${v}`);
var loginSchema = z2.object({
  email: z2.string().trim().toLowerCase().email("Email inv\xE1lido"),
  password: z2.string().min(1, "Ingresa tu contrase\xF1a")
});
var registerSchema = z2.object({
  email: z2.string().trim().toLowerCase().email("Email inv\xE1lido"),
  password: z2.string().min(8, "La contrase\xF1a debe tener al menos 8 caracteres"),
  firstName: z2.string().trim().min(2, "Ingresa tu nombre"),
  lastName: z2.string().trim().min(2, "Ingresa tu apellido"),
  phone: phone.optional(),
  emergencyContactName: z2.string().trim().optional(),
  emergencyContactPhone: phone.optional(),
  healthNotes: z2.string().trim().max(2e3).optional(),
  marketingOptIn: z2.boolean().default(true)
});
var updateProfileSchema = z2.object({
  firstName: z2.string().trim().min(2).optional(),
  lastName: z2.string().trim().min(2).optional(),
  phone: phone.optional(),
  birthDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emergencyContactName: z2.string().trim().optional(),
  emergencyContactPhone: phone.optional(),
  healthNotes: z2.string().trim().max(2e3).optional(),
  goals: z2.string().trim().max(1e3).optional(),
  marketingOptIn: z2.boolean().optional()
});
var changePasswordSchema = z2.object({
  currentPassword: z2.string().min(1),
  newPassword: z2.string().min(8, "La nueva contrase\xF1a debe tener al menos 8 caracteres")
});
var forgotPasswordSchema = z2.object({
  email: z2.string().trim().toLowerCase().email()
});
var resetPasswordSchema = z2.object({
  token: z2.string().min(10),
  newPassword: z2.string().min(8)
});

// server/routes/auth.routes.ts
init_schema();
init_client();

// server/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";
var respondRateLimited = (_req, res) => {
  const err = new DomainError("RATE_LIMITED", "Demasiados intentos. Espera un minuto e int\xE9ntalo de nuevo.");
  res.status(err.status).json({ error: { code: err.code, message: err.message } });
};
var authRateLimit = rateLimit({
  windowMs: 6e4,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respondRateLimited
});
var strictAuthRateLimit = rateLimit({
  windowMs: 6e4,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respondRateLimited
});
var checkoutRateLimit = rateLimit({
  windowMs: 6e4,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respondRateLimited
});

// server/middleware/requireRole.ts
function requireAuth(req, _res, next) {
  if (!req.user) return next(new DomainError("UNAUTHENTICATED", "Necesitas iniciar sesi\xF3n."));
  next();
}
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new DomainError("UNAUTHENTICATED", "Necesitas iniciar sesi\xF3n."));
    if (req.user.role === "owner" || roles.includes(req.user.role)) return next();
    return next(new DomainError("FORBIDDEN", "No tienes permiso para hacer esto."));
  };
}

// server/services/auth.service.ts
import { and as and2, eq as eq2, isNull as isNull2, sql as sql7 } from "drizzle-orm";
init_schema();
init_client();

// server/lib/password.ts
import bcrypt from "bcryptjs";
var COST = 10;
var hashPassword = (plain) => bcrypt.hash(plain, COST);
var verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// server/lib/tokens.ts
import { createHash, randomBytes, timingSafeEqual, createHmac } from "crypto";
var randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
var hmac = (secret, payload) => createHmac("sha256", secret).update(payload).digest("hex");
function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
function signPayload(secret, data, ttlSeconds) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlSeconds * 1e3 })).toString("base64url");
  return `${body}.${hmac(secret, body)}`;
}
function verifyPayload(secret, token) {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(sig, hmac(secret, body))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

// server/services/auth.service.ts
async function login(email, password, ip, userAgent) {
  const [user] = await db.select().from(users).where(eq2(users.email, email)).limit(1);
  const generic = "Email o contrase\xF1a incorrectos.";
  if (!user || !user.passwordHash) fail("UNAUTHENTICATED", generic);
  if (user.status !== "active") fail("FORBIDDEN", "Tu cuenta est\xE1 desactivada. Escr\xEDbenos para reactivarla.");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await db.update(users).set({ failedLoginCount: sql7`${users.failedLoginCount} + 1` }).where(eq2(users.id, user.id));
    fail("UNAUTHENTICATED", generic);
  }
  await db.update(users).set({ failedLoginCount: 0, lastLoginAt: /* @__PURE__ */ new Date() }).where(eq2(users.id, user.id));
  const sessionId = await createSession(user.id, ip, userAgent);
  return { user, sessionId };
}
async function createSession(userId, ip, userAgent) {
  const id = randomToken(32);
  await db.insert(authSessions).values({
    id,
    userId,
    expiresAt: sessionExpiry(),
    ip: ip ?? null,
    userAgent: userAgent?.slice(0, 500) ?? null
  });
  return id;
}
async function revokeSession(sessionId) {
  await db.update(authSessions).set({ revokedAt: /* @__PURE__ */ new Date() }).where(eq2(authSessions.id, sessionId));
}
async function revokeAllSessions(userId) {
  await db.update(authSessions).set({ revokedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(authSessions.userId, userId), isNull2(authSessions.revokedAt)));
}
async function changePassword(userId, current, next) {
  const [user] = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
  if (!user?.passwordHash) fail("NOT_FOUND", "Usuario no encontrado.");
  if (!await verifyPassword(current, user.passwordHash)) {
    fail("VALIDATION", "La contrase\xF1a actual no es correcta.");
  }
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq2(users.id, userId));
  await revokeAllSessions(userId);
}

// server/routes/auth.routes.ts
var authRouter = Router();
var publicUser = (u) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName
});
authRouter.post(
  "/login",
  strictAuthRateLimit,
  wrap(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { user, sessionId } = await login(email, password, req.ip, req.headers["user-agent"]);
    setSessionCookie(res, sessionId);
    res.json({ data: publicUser(user) });
  })
);
authRouter.post(
  "/logout",
  wrap(async (req, res) => {
    if (req.sessionId) await revokeSession(req.sessionId);
    clearSessionCookie(res);
    res.json({ data: { ok: true } });
  })
);
authRouter.get(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    const [user] = await db.select().from(users).where(eq3(users.id, req.user.id)).limit(1);
    res.json({ data: publicUser(user) });
  })
);
authRouter.post(
  "/password/change",
  requireAuth,
  wrap(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePassword(req.user.id, currentPassword, newPassword);
    clearSessionCookie(res);
    res.json({ data: { ok: true } });
  })
);

// server/routes/public.routes.ts
init_schema();
init_client();
init_env();
import { Router as Router2 } from "express";
import { and as and3, asc, eq as eq5 } from "drizzle-orm";
import { z as z3 } from "zod";

// server/payments/index.ts
init_env();

// server/payments/mock.provider.ts
init_env();
import { randomUUID } from "crypto";
var MockProvider = class {
  id = "mock";
  displayName = "Pasarela de prueba";
  async createCheckout(req) {
    const providerPaymentId = `mock_${randomUUID()}`;
    const token = signPayload(
      env().MOCK_WEBHOOK_SECRET,
      { orderId: req.orderId, providerPaymentId, amountClp: req.amountClp, orderNumber: req.orderNumber },
      30 * 60
    );
    return {
      providerPaymentId,
      redirectUrl: `/pagar/mock/${encodeURIComponent(token)}`,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 6e4),
      raw: { simulated: true, orderNumber: req.orderNumber }
    };
  }
  /** Verifica la firma de verdad: si no calza, la ruta responde 401. */
  async parseWebhook(req) {
    const signature = String(req.headers["x-mock-signature"] ?? "");
    const body = req.rawBody.toString("utf8");
    const expected = hmac(env().MOCK_WEBHOOK_SECRET, body);
    const signatureValid = Boolean(signature) && safeEqual(signature, expected);
    const payload = JSON.parse(body);
    return {
      eventId: payload.event_id,
      type: payload.type,
      providerPaymentId: payload.payment_id,
      orderId: payload.order_id,
      amountClp: payload.amount,
      occurredAt: new Date(payload.ts),
      signatureValid,
      raw: payload
    };
  }
  async getPayment(providerPaymentId) {
    return { providerPaymentId, status: "pending", amountClp: 0, raw: {} };
  }
  async refund(req) {
    return { providerRefundId: `mockref_${randomUUID()}`, status: "done", raw: { ...req } };
  }
  /** Sólo del mock: valida el token del pagador simulado. */
  readToken(token) {
    return verifyPayload(
      env().MOCK_WEBHOOK_SECRET,
      token
    );
  }
};

// server/payments/index.ts
var mock = new MockProvider();
function getPaymentProvider(id) {
  const chosen = id ?? env().PAYMENTS_PROVIDER;
  switch (chosen) {
    case "mock":
      return mock;
    case "mercadopago":
    case "flow":
    case "transbank":
      throw new Error(
        `La pasarela "${chosen}" a\xFAn no est\xE1 implementada. Crear server/payments/${chosen}.provider.ts implementando PaymentProvider y registrarlo aqu\xED.`
      );
    default:
      return mock;
  }
}

// server/services/order.service.ts
import { sql as sql8 } from "drizzle-orm";
init_client();

// server/lib/clp.ts
function formatClp(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount);
}

// server/services/email.service.ts
init_schema();
init_policy();
init_client();
import { eq as eq4 } from "drizzle-orm";
function render(body, vars) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => {
    const value = vars[key] ?? STUDIO[key];
    return value === void 0 || value === null ? "" : String(value);
  });
}
async function queue(params) {
  try {
    await db.insert(emailOutbox).values({
      toEmail: params.toEmail,
      toUserId: params.toUserId ?? null,
      subject: params.subject,
      htmlBody: params.htmlBody,
      textBody: params.textBody ?? null,
      templateKey: params.templateKey ?? null,
      campaignId: params.campaignId ?? null,
      dedupeKey: params.dedupeKey ?? null,
      scheduledFor: params.scheduledFor ?? /* @__PURE__ */ new Date()
    }).onConflictDoNothing();
  } catch (err) {
    console.error("[email] no se pudo encolar", err);
  }
}
async function queueTemplate(key, toUserId, toEmail, vars, opts = {}) {
  const [tpl] = await db.select().from(emailTemplates).where(eq4(emailTemplates.key, key)).limit(1);
  if (!tpl || !tpl.isActive) return;
  await queue({
    toEmail,
    toUserId,
    subject: render(tpl.subject, vars),
    htmlBody: render(tpl.htmlBody, vars),
    textBody: tpl.textBody ? render(tpl.textBody, vars) : void 0,
    templateKey: key,
    dedupeKey: opts.dedupeKey,
    scheduledFor: opts.scheduledFor
  });
}

// server/services/order.service.ts
var rowsOf = (r) => Array.isArray(r) ? r : r.rows;
async function nextOrderNumber() {
  const [row] = rowsOf(await db.execute(sql8`SELECT nextval('order_number_seq')::int AS n`));
  return `PP-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(row.n).padStart(6, "0")}`;
}
async function upsertBuyer(buyer) {
  const [existing] = rowsOf(
    await db.execute(sql8`SELECT id FROM users WHERE email = ${buyer.email}`)
  );
  if (existing) return existing.id;
  const parts = buyer.name.trim().split(/\s+/);
  const firstName = parts[0] ?? buyer.name;
  const lastName = parts.slice(1).join(" ") || "-";
  const [created] = rowsOf(
    await db.execute(sql8`
      INSERT INTO users (email, role, first_name, last_name, phone)
      VALUES (${buyer.email}, 'student', ${firstName}, ${lastName}, ${buyer.phone ?? null})
      RETURNING id
    `)
  );
  return created.id;
}
async function createPlanOrder(buyer, planSlug) {
  const [plan] = rowsOf(
    await db.execute(sql8`
      SELECT id, name, price_clp, credits, validity_days, requires_verification
        FROM plans WHERE slug = ${planSlug} AND is_active AND is_public
    `)
  );
  if (!plan) fail("NOT_FOUND", "Ese plan no existe o ya no est\xE1 disponible.");
  const studentId = await upsertBuyer(buyer);
  const orderNumber = await nextOrderNumber();
  const [order] = rowsOf(
    await db.execute(sql8`
      INSERT INTO orders (order_number, student_id, status, subtotal_clp, discount_clp, total_clp, expires_at)
      VALUES (${orderNumber}, ${studentId}::uuid, 'awaiting_payment', ${plan.price_clp}, 0, ${plan.price_clp},
              now() + INTERVAL '30 minutes')
      RETURNING id
    `)
  );
  await db.execute(sql8`
    INSERT INTO order_items (order_id, kind, plan_id, description, unit_price_clp, quantity, total_clp)
    VALUES (${order.id}::uuid, 'plan', ${plan.id}::uuid, ${plan.name}, ${plan.price_clp}, 1, ${plan.price_clp})
  `);
  return { orderId: order.id, orderNumber, totalClp: plan.price_clp, description: plan.name, studentId };
}
async function fulfillOrder(orderId) {
  const [order] = rowsOf(
    await db.execute(sql8`
      SELECT o.id, o.student_id, o.order_number, o.status::text AS status, o.total_clp, u.email, u.first_name
        FROM orders o JOIN users u ON u.id = o.student_id
       WHERE o.id = ${orderId}::uuid
    `)
  );
  if (!order) return false;
  const [already] = rowsOf(
    await db.execute(sql8`SELECT count(*)::int AS n FROM memberships WHERE order_id = ${orderId}::uuid`)
  );
  if (already.n > 0) return false;
  const items = rowsOf(
    await db.execute(sql8`SELECT kind::text AS kind, plan_id FROM order_items WHERE order_id = ${orderId}::uuid`)
  );
  for (const item of items) {
    if (!item.plan_id) continue;
    const [plan] = rowsOf(
      await db.execute(sql8`SELECT credits, validity_days, requires_verification, name FROM plans WHERE id = ${item.plan_id}::uuid`)
    );
    const status = plan.requires_verification ? "pending_verification" : "active";
    const [m] = rowsOf(
      await db.execute(sql8`
        INSERT INTO memberships (student_id, plan_id, order_id, status, credits_total, credits_used,
                                 starts_on, ends_on, activated_at, price_paid_clp)
        VALUES (${order.student_id}::uuid, ${item.plan_id}::uuid, ${orderId}::uuid, ${status}::membership_status,
                ${plan.credits}, 0,
                (now() AT TIME ZONE 'America/Santiago')::date,
                (now() AT TIME ZONE 'America/Santiago')::date + ${plan.validity_days}::int,
                now(), ${order.total_clp})
        RETURNING id
      `)
    );
    await db.execute(sql8`
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, order_id, note)
      VALUES (${m.id}::uuid, ${order.student_id}::uuid, ${plan.credits}, 'purchase', ${orderId}::uuid,
              ${"Compra " + order.order_number})
    `);
    await queueTemplate("payment_receipt", order.student_id, order.email, {
      nombre: order.first_name,
      orden: order.order_number,
      plan: plan.name,
      monto: formatClp(order.total_clp),
      creditos: plan.credits
    });
  }
  return true;
}
async function getOrder(orderId) {
  const [order] = rowsOf(
    await db.execute(sql8`
      SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
             o.subtotal_clp AS "subtotalClp", o.discount_clp AS "discountClp", o.total_clp AS "totalClp",
             o.expires_at AS "expiresAt", o.paid_at AS "paidAt",
             (SELECT json_agg(json_build_object('description', oi.description, 'kind', oi.kind,
                                                'totalClp', oi.total_clp))
                FROM order_items oi WHERE oi.order_id = o.id) AS items
        FROM orders o WHERE o.id = ${orderId}::uuid
    `)
  );
  if (!order) fail("NOT_FOUND", "Esa orden no existe.");
  return order;
}

// server/services/payment.service.ts
init_client();
import { sql as sql9 } from "drizzle-orm";
var rowsOf2 = (r) => Array.isArray(r) ? r : r.rows;
async function applyWebhookEvent(provider, event) {
  const inserted = rowsOf2(
    await db.execute(sql9`
      INSERT INTO payment_events (provider, event_id, event_type, signature_valid, payload)
      VALUES (${provider}, ${event.eventId}, ${event.type}, ${event.signatureValid},
              ${JSON.stringify(event.raw)}::jsonb)
      ON CONFLICT (provider, event_id) DO NOTHING
      RETURNING id
    `)
  );
  if (!inserted.length) return { duplicated: true, applied: false };
  const statusMap = {
    "payment.pending": "pending",
    "payment.paid": "paid",
    "payment.failed": "failed",
    "payment.expired": "expired",
    "payment.refunded": "refunded"
  };
  const newStatus = statusMap[event.type];
  await db.execute(sql9`
    UPDATE payments
       SET status = ${newStatus}::payment_status,
           paid_at = CASE WHEN ${newStatus} = 'paid' THEN now() ELSE paid_at END,
           updated_at = now()
     WHERE provider = ${provider} AND provider_payment_id = ${event.providerPaymentId}
  `);
  const [payment] = rowsOf2(
    await db.execute(sql9`
      SELECT order_id FROM payments WHERE provider = ${provider} AND provider_payment_id = ${event.providerPaymentId}
    `)
  );
  const orderId = payment?.order_id ?? event.orderId;
  if (!orderId) return { duplicated: false, applied: false };
  if (newStatus === "paid") {
    await db.execute(sql9`
      UPDATE orders SET status = 'paid', paid_at = now(), updated_at = now()
       WHERE id = ${orderId}::uuid AND status <> 'paid'
    `);
    await fulfillOrder(orderId);
  } else if (newStatus === "failed" || newStatus === "expired") {
    await db.execute(sql9`
      UPDATE orders SET status = ${newStatus === "failed" ? "failed" : "expired"}::order_status, updated_at = now()
       WHERE id = ${orderId}::uuid AND status = 'awaiting_payment'
    `);
  }
  await db.execute(sql9`
    UPDATE payment_events SET processed_at = now() WHERE id = ${inserted[0].id}
  `);
  return { duplicated: false, applied: true, orderId, status: newStatus };
}
async function createPaymentRecord(params) {
  await db.execute(sql9`
    INSERT INTO payments (order_id, provider, provider_payment_id, status, amount_clp, redirect_url)
    VALUES (${params.orderId}::uuid, ${params.provider}, ${params.providerPaymentId}, 'pending',
            ${params.amountClp}, ${params.redirectUrl})
  `);
  await db.execute(sql9`
    UPDATE orders SET provider = ${params.provider}, updated_at = now() WHERE id = ${params.orderId}::uuid
  `);
}

// server/routes/public.routes.ts
var publicRouter = Router2();
publicRouter.get(
  "/class-types",
  wrap(async (_req, res) => {
    const rows = await db.select().from(classTypes).where(and3(eq5(classTypes.isActive, true), eq5(classTypes.isPublic, true))).orderBy(asc(classTypes.sortOrder));
    res.json({ data: rows });
  })
);
publicRouter.get(
  "/plans",
  wrap(async (_req, res) => {
    const rows = await db.select().from(plans).where(and3(eq5(plans.isActive, true), eq5(plans.isPublic, true))).orderBy(asc(plans.sortOrder), asc(plans.priceClp));
    res.json({ data: rows });
  })
);
var contactSchema = z3.object({
  name: z3.string().trim().min(2),
  email: z3.string().trim().toLowerCase().email(),
  phone: z3.string().trim().optional(),
  message: z3.string().trim().max(2e3).optional(),
  interest: z3.string().trim().max(120).optional()
});
publicRouter.post(
  "/contact",
  wrap(async (req, res) => {
    const input = contactSchema.parse(req.body);
    await db.insert(contactLeads).values(input);
    res.status(201).json({ data: { ok: true } });
  })
);
var checkoutSchema = z3.object({
  planSlug: z3.string().min(1),
  name: z3.string().trim().min(2),
  email: z3.string().trim().toLowerCase().email(),
  phone: z3.string().trim().min(6).optional()
});
publicRouter.post(
  "/checkout",
  checkoutRateLimit,
  wrap(async (req, res) => {
    const input = checkoutSchema.parse(req.body);
    const order = await createPlanOrder(input, input.planSlug);
    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      amountClp: order.totalClp,
      description: order.description,
      customer: { id: order.studentId, email: input.email, name: input.name },
      returnUrl: `${appUrl()}/pago/resultado?orderId=${order.orderId}`,
      cancelUrl: `${appUrl()}/planes`,
      webhookUrl: `${appUrl()}/api/webhooks/payments/${provider.id}`,
      idempotencyKey: `order-${order.orderId}`
    });
    await createPaymentRecord({
      orderId: order.orderId,
      provider: provider.id,
      providerPaymentId: session.providerPaymentId,
      amountClp: order.totalClp,
      redirectUrl: session.redirectUrl
    });
    res.status(201).json({ data: { orderId: order.orderId, redirectUrl: session.redirectUrl } });
  })
);
publicRouter.get(
  "/checkout/orders/:id",
  wrap(async (req, res) => {
    const order = await getOrder(req.params.id);
    res.json({ data: order });
  })
);
publicRouter.get(
  "/checkout/mock/:token",
  wrap(async (req, res) => {
    const payload = mock.readToken(req.params.token);
    if (!payload) {
      return res.status(410).json({ error: { code: "ORDER_EXPIRED", message: "Este enlace de pago venci\xF3." } });
    }
    res.json({ data: payload });
  })
);
publicRouter.post(
  "/checkout/mock/:token/:outcome",
  wrap(async (req, res) => {
    if (env().PAYMENTS_PROVIDER !== "mock") {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "La pasarela simulada est\xE1 desactivada." } });
    }
    const payload = mock.readToken(req.params.token);
    if (!payload) {
      return res.status(410).json({ error: { code: "ORDER_EXPIRED", message: "Este enlace de pago venci\xF3." } });
    }
    const outcome = req.params.outcome === "approved" ? "payment.paid" : "payment.failed";
    const body = JSON.stringify({
      event_id: `mock_evt_${payload.providerPaymentId}_${outcome}`,
      type: outcome,
      payment_id: payload.providerPaymentId,
      order_id: payload.orderId,
      amount: payload.amountClp,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
    const event = await mock.parseWebhook({
      headers: { "x-mock-signature": hmac(env().MOCK_WEBHOOK_SECRET, body) },
      rawBody: Buffer.from(body),
      query: {}
    });
    if (!event.signatureValid) {
      return res.status(401).json({ error: { code: "FORBIDDEN", message: "Firma inv\xE1lida." } });
    }
    const result = await applyWebhookEvent("mock", event);
    res.json({ data: { ...result, returnUrl: `/pago/resultado?orderId=${payload.orderId}` } });
  })
);

// server/routes/admin.routes.ts
init_client();
import { Router as Router3 } from "express";
import { sql as sql10 } from "drizzle-orm";
import { z as z4 } from "zod";
var adminRouter = Router3();
var owner = requireRole("owner");
var rowsOf3 = (r) => Array.isArray(r) ? r : r.rows;
adminRouter.get("/plans", owner, wrap(async (_req, res) => {
  const rows = rowsOf3(await db.execute(sql10`
    SELECT id, slug, name, segment::text AS segment, period_months AS "periodMonths", credits,
           price_clp AS "priceClp", validity_days AS "validityDays",
           requires_verification AS "requiresVerification", is_drop_in AS "isDropIn",
           allowed_weekdays AS "allowedWeekdays", allowed_time_from::text AS "allowedTimeFrom",
           allowed_time_to::text AS "allowedTimeTo", is_public AS "isPublic", is_active AS "isActive",
           sort_order AS "sortOrder", badge
      FROM plans ORDER BY sort_order, price_clp`));
  res.json({ data: rows });
}));
adminRouter.patch("/plans/:id", owner, wrap(async (req, res) => {
  const input = z4.object({
    name: z4.string().min(2).optional(),
    priceClp: z4.number().int().min(0).optional(),
    credits: z4.number().int().min(1).optional(),
    validityDays: z4.number().int().min(1).optional(),
    isPublic: z4.boolean().optional(),
    isActive: z4.boolean().optional(),
    badge: z4.string().max(40).nullable().optional()
  }).parse(req.body);
  const sets = [];
  if (input.name !== void 0) sets.push(sql10`name = ${input.name}`);
  if (input.priceClp !== void 0) sets.push(sql10`price_clp = ${input.priceClp}`);
  if (input.credits !== void 0) sets.push(sql10`credits = ${input.credits}`);
  if (input.validityDays !== void 0) sets.push(sql10`validity_days = ${input.validityDays}`);
  if (input.isPublic !== void 0) sets.push(sql10`is_public = ${input.isPublic}`);
  if (input.isActive !== void 0) sets.push(sql10`is_active = ${input.isActive}`);
  if (input.badge !== void 0) sets.push(sql10`badge = ${input.badge}`);
  if (!sets.length) return res.json({ data: { ok: true } });
  await db.execute(sql10`UPDATE plans SET ${sql10.join(sets, sql10`, `)} WHERE id = ${req.params.id}::uuid`);
  res.json({ data: { ok: true } });
}));
adminRouter.get("/class-types", owner, wrap(async (_req, res) => {
  const rows = rowsOf3(await db.execute(sql10`
    SELECT id, slug, name, short_description AS "shortDescription", description,
           discipline::text AS discipline, level::text AS level,
           default_duration_min AS "defaultDurationMin", default_capacity AS "defaultCapacity",
           drop_in_price_clp AS "dropInPriceClp", color, is_public AS "isPublic", is_active AS "isActive"
      FROM class_types ORDER BY sort_order`));
  res.json({ data: rows });
}));
adminRouter.patch("/class-types/:id", owner, wrap(async (req, res) => {
  const input = z4.object({
    name: z4.string().min(2).optional(),
    shortDescription: z4.string().max(200).nullable().optional(),
    description: z4.string().max(4e3).nullable().optional(),
    dropInPriceClp: z4.number().int().min(0).nullable().optional(),
    isPublic: z4.boolean().optional(),
    isActive: z4.boolean().optional()
  }).parse(req.body);
  const sets = [];
  if (input.name !== void 0) sets.push(sql10`name = ${input.name}`);
  if (input.shortDescription !== void 0) sets.push(sql10`short_description = ${input.shortDescription}`);
  if (input.description !== void 0) sets.push(sql10`description = ${input.description}`);
  if (input.dropInPriceClp !== void 0) sets.push(sql10`drop_in_price_clp = ${input.dropInPriceClp}`);
  if (input.isPublic !== void 0) sets.push(sql10`is_public = ${input.isPublic}`);
  if (input.isActive !== void 0) sets.push(sql10`is_active = ${input.isActive}`);
  if (!sets.length) return res.json({ data: { ok: true } });
  await db.execute(sql10`UPDATE class_types SET ${sql10.join(sets, sql10`, `)} WHERE id = ${req.params.id}::uuid`);
  res.json({ data: { ok: true } });
}));
adminRouter.get("/settings", owner, wrap(async (_req, res) => {
  const { getSettings: getSettings2 } = await Promise.resolve().then(() => (init_settings_service(), settings_service_exports));
  res.json({ data: await getSettings2() });
}));
adminRouter.patch("/settings", owner, wrap(async (req, res) => {
  const entries = Object.entries(req.body ?? {});
  for (const [key, value] of entries) {
    await db.execute(sql10`
      INSERT INTO settings (key, value, updated_by) VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${req.user.id}::uuid)
      ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now()`);
  }
  res.json({ data: { actualizadas: entries.length } });
}));
adminRouter.get("/leads", owner, wrap(async (_req, res) => {
  const rows = rowsOf3(await db.execute(sql10`
    SELECT id, name, email, phone, message, interest, status::text AS status, created_at AS "createdAt"
      FROM contact_leads ORDER BY created_at DESC LIMIT 100`));
  res.json({ data: rows });
}));

// server/routes/index.ts
function registerRoutes(app2) {
  app2.use(loadSession);
  app2.get(
    "/api/health",
    wrap(async (_req, res) => {
      const started = Date.now();
      const result = await db.execute(
        sql11`SELECT now() AS now, (now() AT TIME ZONE 'America/Santiago')::date AS today`
      );
      const rows = Array.isArray(result) ? result : result.rows;
      res.json({
        data: {
          ok: true,
          driver: usingNeon ? "neon-http" : "node-postgres",
          dbLatencyMs: Date.now() - started,
          serverTime: rows[0]?.now ?? null,
          studioToday: rows[0]?.today ?? null
        }
      });
    })
  );
  app2.use("/api/auth", authRouter);
  app2.use("/api/public", publicRouter);
  app2.use("/api/admin", adminRouter);
}

// server/app.ts
function buildApp() {
  const app2 = express();
  app2.set("trust proxy", true);
  app2.use(express.json({ limit: "1mb" }));
  app2.use(express.urlencoded({ extended: false }));
  registerRoutes(app2);
  app2.use("/api", notFound);
  app2.use(errorHandler);
  return app2;
}

// server/vercel-handler.ts
var app = buildApp();
function handler(req, res) {
  return app(req, res);
}
export {
  handler as default
};
