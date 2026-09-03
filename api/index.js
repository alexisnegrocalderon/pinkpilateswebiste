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

// shared/domain/errors.ts
var STATUS, DomainError, fail;
var init_errors = __esm({
  "shared/domain/errors.ts"() {
    "use strict";
    STATUS = {
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
    DomainError = class extends Error {
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
    fail = (code, message, details) => {
      throw new DomainError(code, message, details);
    };
  }
});

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
    usersRelations = relations(users, ({ one: one2 }) => ({
      studentProfile: one2(studentProfiles, {
        fields: [users.id],
        references: [studentProfiles.userId]
      }),
      instructorProfile: one2(instructorProfiles, {
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
      MOCK_WEBHOOK_SECRET: z.string().min(8).default("dev-mock-webhook-secret"),
      CRON_SECRET: z.string().min(8).default("dev-cron-secret"),
      PAYMENTS_PROVIDER: z.enum(["mock", "mercadopago", "flow", "transbank"]).default("mock"),
      APP_URL: z.string().url().optional(),
      NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
      PORT: z.coerce.number().default(3001),
      VERCEL_URL: z.string().optional()
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
      /** Horas antes del inicio bajo las cuales cancelar cuesta el crédito. */
      late_cancel_hours: 12,
      /** Con cuántos días de anticipación se abre la reserva. */
      booking_opens_days_ahead: 30,
      /** Minutos antes del inicio en que se cierra la reserva. */
      booking_closes_minutes_before: 60,
      /** Cuánto dura una oferta de lista de espera sin auto-reserva. */
      waitlist_offer_minutes: 120,
      /** El no-show consume el crédito. */
      no_show_forfeits_credit: true,
      /** Cuántos días hacia adelante se materializan clases. */
      booking_horizon_days: 60,
      /** Minutos que se sostiene el cupo mientras se paga una clase suelta. */
      order_hold_minutes: 30
    };
    STUDIO = {
      name: "Pink Pilates",
      tagline: "Pink, Unleashed",
      email: "contacto@pinkpilates.cl",
      phone: "+56999471471",
      instagram: "@pinkpilates",
      address: "Angamos 326, Re\xF1aca / Vi\xF1a del Mar"
    };
  }
});

// server/services/email.service.ts
import { eq as eq3 } from "drizzle-orm";
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
  const [tpl] = await db.select().from(emailTemplates).where(eq3(emailTemplates.key, key)).limit(1);
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
var init_email_service = __esm({
  "server/services/email.service.ts"() {
    "use strict";
    init_schema();
    init_policy();
    init_client();
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

// server/lib/clp.ts
function formatClp(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount);
}
var init_clp = __esm({
  "server/lib/clp.ts"() {
    "use strict";
  }
});

// server/services/order.service.ts
var order_service_exports = {};
__export(order_service_exports, {
  createPlanOrder: () => createPlanOrder,
  fulfillOrder: () => fulfillOrder,
  getOrder: () => getOrder
});
import { sql as sql14 } from "drizzle-orm";
async function nextOrderNumber() {
  const [row] = rowsOf2(await db.execute(sql14`SELECT nextval('order_number_seq')::int AS n`));
  return `PP-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(row.n).padStart(6, "0")}`;
}
async function createPlanOrder(studentId, planSlug) {
  const [plan] = rowsOf2(
    await db.execute(sql14`
      SELECT id, name, price_clp, credits, validity_days, requires_verification
        FROM plans WHERE slug = ${planSlug} AND is_active AND is_public
    `)
  );
  if (!plan) fail("NOT_FOUND", "Ese plan no existe o ya no est\xE1 disponible.");
  const orderNumber = await nextOrderNumber();
  const [order] = rowsOf2(
    await db.execute(sql14`
      INSERT INTO orders (order_number, student_id, status, subtotal_clp, discount_clp, total_clp, expires_at)
      VALUES (${orderNumber}, ${studentId}::uuid, 'awaiting_payment', ${plan.price_clp}, 0, ${plan.price_clp},
              now() + INTERVAL '30 minutes')
      RETURNING id
    `)
  );
  await db.execute(sql14`
    INSERT INTO order_items (order_id, kind, plan_id, description, unit_price_clp, quantity, total_clp)
    VALUES (${order.id}::uuid, 'plan', ${plan.id}::uuid, ${plan.name}, ${plan.price_clp}, 1, ${plan.price_clp})
  `);
  return { orderId: order.id, orderNumber, totalClp: plan.price_clp, description: plan.name };
}
async function fulfillOrder(orderId) {
  const [order] = rowsOf2(
    await db.execute(sql14`
      SELECT o.id, o.student_id, o.order_number, o.status::text AS status, o.total_clp, u.email, u.first_name
        FROM orders o JOIN users u ON u.id = o.student_id
       WHERE o.id = ${orderId}::uuid
    `)
  );
  if (!order) return false;
  const [already] = rowsOf2(
    await db.execute(sql14`SELECT count(*)::int AS n FROM memberships WHERE order_id = ${orderId}::uuid`)
  );
  if (already.n > 0) return false;
  const items = rowsOf2(
    await db.execute(sql14`SELECT kind::text AS kind, plan_id, class_session_id FROM order_items WHERE order_id = ${orderId}::uuid`)
  );
  for (const item of items) {
    if (!item.plan_id) continue;
    const [plan] = rowsOf2(
      await db.execute(sql14`SELECT credits, validity_days, requires_verification, name FROM plans WHERE id = ${item.plan_id}::uuid`)
    );
    const status = plan.requires_verification ? "pending_verification" : "active";
    const [m] = rowsOf2(
      await db.execute(sql14`
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
    await db.execute(sql14`
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
  await db.execute(sql14`
    UPDATE reservations r
       SET membership_id = (SELECT id FROM memberships WHERE order_id = ${orderId}::uuid LIMIT 1),
           credit_charged = true
     WHERE r.order_id = ${orderId}::uuid AND r.status = 'booked' AND r.membership_id IS NULL
  `);
  await db.execute(sql14`
    UPDATE memberships SET credits_used = 1
     WHERE order_id = ${orderId}::uuid
       AND EXISTS (SELECT 1 FROM reservations WHERE order_id = ${orderId}::uuid AND status = 'booked')
  `);
  return true;
}
async function getOrder(orderId, studentId) {
  const [order] = rowsOf2(
    await db.execute(sql14`
      SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
             o.subtotal_clp AS "subtotalClp", o.discount_clp AS "discountClp", o.total_clp AS "totalClp",
             o.expires_at AS "expiresAt", o.paid_at AS "paidAt", o.student_id AS "studentId",
             (SELECT json_agg(json_build_object('description', oi.description, 'kind', oi.kind,
                                                'totalClp', oi.total_clp))
                FROM order_items oi WHERE oi.order_id = o.id) AS items,
             (SELECT p.redirect_url FROM payments p WHERE p.order_id = o.id ORDER BY p.created_at DESC LIMIT 1) AS "redirectUrl"
        FROM orders o WHERE o.id = ${orderId}::uuid
    `)
  );
  if (!order) fail("NOT_FOUND", "Esa orden no existe.");
  if (studentId && order.studentId !== studentId) fail("NOT_FOUND", "Esa orden no existe.");
  return order;
}
var rowsOf2;
var init_order_service = __esm({
  "server/services/order.service.ts"() {
    "use strict";
    init_errors();
    init_client();
    init_clp();
    init_email_service();
    rowsOf2 = (r) => Array.isArray(r) ? r : r.rows;
  }
});

// server/app.ts
import express from "express";

// server/middleware/errorHandler.ts
init_errors();
import { ZodError } from "zod";
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
import { sql as sql17 } from "drizzle-orm";

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
import { eq as eq4 } from "drizzle-orm";

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

// server/middleware/requireRole.ts
init_errors();
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
init_errors();
init_schema();
init_client();
import { and as and2, eq as eq2, isNull as isNull2, sql as sql7 } from "drizzle-orm";

// server/lib/password.ts
import bcrypt from "bcryptjs";
var COST = 10;
var hashPassword = (plain) => bcrypt.hash(plain, COST);
var verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// server/lib/tokens.ts
import { createHash, randomBytes, timingSafeEqual, createHmac } from "crypto";
var randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
var sha256 = (value) => createHash("sha256").update(value).digest("hex");
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
async function register(input, ip, userAgent) {
  const existing = await db.select({ id: users.id }).from(users).where(eq2(users.email, input.email)).limit(1);
  if (existing.length) {
    fail("CONFLICT", "Ya existe una cuenta con ese email. Inicia sesi\xF3n o recupera tu contrase\xF1a.");
  }
  const [user] = await db.insert(users).values({
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: "student",
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone
  }).returning();
  await db.insert(studentProfiles).values({
    userId: user.id,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    healthNotes: input.healthNotes,
    marketingOptIn: input.marketingOptIn
  });
  const sessionId = await createSession(user.id, ip, userAgent);
  return { user, sessionId };
}
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
async function createPasswordResetToken(email) {
  const [user] = await db.select({ id: users.id }).from(users).where(eq2(users.email, email)).limit(1);
  if (!user) return null;
  const token = randomToken(32);
  await db.insert(passwordResetTokens).values({
    tokenHash: sha256(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1e3)
  });
  return { token, userId: user.id };
}
async function resetPassword(token, newPassword) {
  const hash = sha256(token);
  const [row] = await db.select().from(passwordResetTokens).where(and2(eq2(passwordResetTokens.tokenHash, hash), isNull2(passwordResetTokens.usedAt))).limit(1);
  if (!row || row.expiresAt < /* @__PURE__ */ new Date()) {
    fail("VALIDATION", "El enlace de recuperaci\xF3n venci\xF3 o ya fue usado. Pide uno nuevo.");
  }
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq2(users.id, row.userId));
  await db.update(passwordResetTokens).set({ usedAt: /* @__PURE__ */ new Date() }).where(eq2(passwordResetTokens.tokenHash, hash));
  await revokeAllSessions(row.userId);
}

// server/routes/auth.routes.ts
init_email_service();
var authRouter = Router();
var publicUser = (u) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName
});
authRouter.post(
  "/register",
  wrap(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const { user, sessionId } = await register(input, req.ip, req.headers["user-agent"]);
    setSessionCookie(res, sessionId);
    await queueTemplate("welcome", user.id, user.email, { nombre: user.firstName });
    res.status(201).json({ data: publicUser(user) });
  })
);
authRouter.post(
  "/login",
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
    const [row] = await db.select().from(users).leftJoin(studentProfiles, eq4(studentProfiles.userId, users.id)).where(eq4(users.id, req.user.id)).limit(1);
    res.json({
      data: {
        ...publicUser(row.users),
        phone: row.users.phone,
        birthDate: row.users.birthDate,
        profile: row.student_profiles ?? null
      }
    });
  })
);
authRouter.patch(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    const input = updateProfileSchema.parse(req.body);
    const userId = req.user.id;
    const userFields = {
      ...input.firstName !== void 0 && { firstName: input.firstName },
      ...input.lastName !== void 0 && { lastName: input.lastName },
      ...input.phone !== void 0 && { phone: input.phone },
      ...input.birthDate !== void 0 && { birthDate: input.birthDate }
    };
    if (Object.keys(userFields).length) {
      await db.update(users).set({ ...userFields, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(users.id, userId));
    }
    const profileFields = {
      ...input.emergencyContactName !== void 0 && { emergencyContactName: input.emergencyContactName },
      ...input.emergencyContactPhone !== void 0 && { emergencyContactPhone: input.emergencyContactPhone },
      ...input.healthNotes !== void 0 && { healthNotes: input.healthNotes },
      ...input.goals !== void 0 && { goals: input.goals },
      ...input.marketingOptIn !== void 0 && { marketingOptIn: input.marketingOptIn }
    };
    if (Object.keys(profileFields).length) {
      await db.update(studentProfiles).set(profileFields).where(eq4(studentProfiles.userId, userId));
    }
    res.json({ data: { ok: true } });
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
authRouter.post(
  "/password/forgot",
  wrap(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await createPasswordResetToken(email);
    if (result) {
      await queueTemplate("password_reset", result.userId, email, { token: result.token });
    }
    res.json({ data: { ok: true } });
  })
);
authRouter.post(
  "/password/reset",
  wrap(async (req, res) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await resetPassword(token, newPassword);
    res.json({ data: { ok: true } });
  })
);

// server/routes/public.routes.ts
init_schema();
init_client();
import { Router as Router2 } from "express";
import { and as and3, asc, eq as eq5, sql as sql9 } from "drizzle-orm";
import { z as z3 } from "zod";

// server/services/schedule.service.ts
init_client();
init_settings_service();
import { sql as sql8 } from "drizzle-orm";
async function materializeSessions(through) {
  const horizonDays = await getSetting("booking_horizon_days");
  const limit = through ?? null;
  const result = await db.execute(sql8`
    WITH bounds AS (
      SELECT (now() AT TIME ZONE 'America/Santiago')::date AS today,
             COALESCE(${limit}::date,
                      (now() AT TIME ZONE 'America/Santiago')::date + ${horizonDays}::int) AS through
    ),
    inserted AS (
      INSERT INTO class_sessions (
        template_id, class_type_id, instructor_id, room_id,
        local_date, start_time, starts_at, ends_at, duration_min, capacity
      )
      SELECT
        t.id, t.class_type_id, t.instructor_id, t.room_id,
        d::date,
        t.start_time,
        (d::date + t.start_time) AT TIME ZONE t.timezone,
        ((d::date + t.start_time) AT TIME ZONE t.timezone) + (t.duration_min || ' minutes')::interval,
        t.duration_min,
        t.capacity
      FROM class_templates t
      CROSS JOIN bounds b
      CROSS JOIN LATERAL generate_series(
        GREATEST(t.effective_from, b.today, COALESCE(t.materialized_through + 1, b.today)),
        LEAST(COALESCE(t.effective_to, DATE '9999-12-31'), b.through),
        INTERVAL '1 day'
      ) AS d
      WHERE t.is_active
        AND EXTRACT(DOW FROM d)::int = t.weekday
      ON CONFLICT (template_id, local_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*)::int AS created FROM inserted
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  await db.execute(sql8`
    UPDATE class_templates t
       SET materialized_through = LEAST(
             COALESCE(t.effective_to, DATE '9999-12-31'),
             COALESCE(${limit}::date,
                      (now() AT TIME ZONE 'America/Santiago')::date + ${horizonDays}::int)
           ),
           updated_at = now()
     WHERE t.is_active
       AND (t.materialized_through IS NULL
            OR t.materialized_through < COALESCE(${limit}::date,
                 (now() AT TIME ZONE 'America/Santiago')::date + ${horizonDays}::int))
  `);
  return rows[0]?.created ?? 0;
}
async function ensureHorizon(minDays = 14) {
  const result = await db.execute(sql8`
    SELECT count(*)::int AS pending
      FROM class_templates
     WHERE is_active
       AND (materialized_through IS NULL
            OR materialized_through < (now() AT TIME ZONE 'America/Santiago')::date + ${minDays}::int)
       AND (effective_to IS NULL
            OR effective_to >= (now() AT TIME ZONE 'America/Santiago')::date)
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  if ((rows[0]?.pending ?? 0) > 0) await materializeSessions();
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
var scheduleQuery = z3.object({
  from: z3.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z3.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  classTypeId: z3.string().uuid().optional(),
  instructorId: z3.string().uuid().optional()
});
publicRouter.get(
  "/schedule",
  wrap(async (req, res) => {
    const q = scheduleQuery.parse(req.query);
    await ensureHorizon(14);
    const result = await db.execute(sql9`
      SELECT s.id,
             s.local_date::text            AS "localDate",
             s.start_time::text            AS "startTime",
             s.starts_at                   AS "startsAt",
             s.ends_at                     AS "endsAt",
             s.duration_min                AS "durationMin",
             s.capacity,
             s.booked_count                AS "bookedCount",
             s.waitlist_count              AS "waitlistCount",
             GREATEST(0, s.capacity - s.booked_count) AS "spotsLeft",
             (s.booked_count >= s.capacity)           AS "isFull",
             -- Una clase que ya empezo (o esta dentro de la ventana de cierre)
             -- no debe ofrecer boton de reservar: el servidor la rechazaria y
             -- la alumna se llevaria un error evitable.
             (s.starts_at <= now() + (COALESCE(
                (SELECT (value #>> '{}')::int FROM settings WHERE key = 'booking_closes_minutes_before'), 60
              ) || ' minutes')::interval)              AS "bookingClosed",
             s.status::text                AS status,
             ct.id                         AS "classTypeId",
             ct.name                       AS "className",
             ct.slug                       AS "classSlug",
             ct.discipline::text           AS discipline,
             ct.color,
             ct.drop_in_price_clp          AS "dropInPriceClp",
             r.name                        AS "roomName",
             i.id                          AS "instructorId",
             COALESCE(i.first_name || ' ' || i.last_name, 'Por confirmar') AS "instructorName"
        FROM class_sessions s
        JOIN class_types ct ON ct.id = s.class_type_id
        JOIN rooms r        ON r.id = s.room_id
        LEFT JOIN users i   ON i.id = s.instructor_id
       WHERE s.status = 'scheduled'
         AND ct.is_public
         AND s.local_date >= COALESCE(${q.from ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date)
         AND s.local_date <= COALESCE(${q.to ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date + 14)
         AND (${q.classTypeId ?? null}::uuid IS NULL OR s.class_type_id = ${q.classTypeId ?? null}::uuid)
         AND (${q.instructorId ?? null}::uuid IS NULL OR s.instructor_id = ${q.instructorId ?? null}::uuid)
       ORDER BY s.starts_at ASC
    `);
    const rows = Array.isArray(result) ? result : result.rows;
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
publicRouter.get(
  "/instructors",
  wrap(async (_req, res) => {
    const rows = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      bio: instructorProfiles.bio,
      specialties: instructorProfiles.specialties,
      calendarColor: instructorProfiles.calendarColor
    }).from(instructorProfiles).innerJoin(users, eq5(users.id, instructorProfiles.userId)).where(eq5(instructorProfiles.isActive, true));
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

// server/routes/student.routes.ts
init_client();
import { Router as Router3 } from "express";
import { sql as sql13 } from "drizzle-orm";
import { z as z4 } from "zod";

// server/services/booking.service.ts
init_errors();
import { eq as eq6, sql as sql11 } from "drizzle-orm";

// shared/domain/time.ts
import { TZDate } from "@date-fns/tz";
var DIAS = ["domingo", "lunes", "martes", "mi\xE9rcoles", "jueves", "viernes", "s\xE1bado"];
var weekdayName = (w) => DIAS[w] ?? "";
var hhmm = (t) => t.slice(0, 5);

// server/services/booking.service.ts
init_schema();
init_client();

// server/sql/bookSpot.sql.ts
init_client();
import { sql as sql10 } from "drizzle-orm";
async function bookSpot(params) {
  const { sessionId, studentId, membershipId, closeMinutesBefore, source = "web" } = params;
  const result = await db.execute(sql10`
    WITH sess AS (
      UPDATE class_sessions
         SET booked_count = booked_count + 1,
             updated_at = now()
       WHERE id = ${sessionId}::uuid
         AND status = 'scheduled'
         AND booked_count < capacity
         AND starts_at > now() + (${closeMinutesBefore}::int || ' minutes')::interval
      RETURNING id
    ),
    mem AS (
      UPDATE memberships
         SET credits_used = credits_used + 1,
             updated_at = now()
       WHERE id = ${membershipId}::uuid
         AND status = 'active'
         AND ends_on >= (now() AT TIME ZONE 'America/Santiago')::date
         AND credits_used < credits_total
         AND EXISTS (SELECT 1 FROM sess)
      RETURNING id, credits_total, credits_used
    ),
    res AS (
      INSERT INTO reservations (session_id, student_id, membership_id, status, source, credit_charged)
      SELECT ${sessionId}::uuid, ${studentId}::uuid, ${membershipId}::uuid, 'booked', ${source}::reservation_source, true
      WHERE EXISTS (SELECT 1 FROM sess) AND EXISTS (SELECT 1 FROM mem)
      RETURNING id
    ),
    ledger AS (
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, reservation_id, balance_after)
      SELECT ${membershipId}::uuid, ${studentId}::uuid, -1, 'booking', res.id,
             mem.credits_total - mem.credits_used
      FROM res CROSS JOIN mem
      RETURNING reservation_id
    )
    SELECT res.id AS reservation_id,
           (SELECT credits_total - credits_used FROM mem) AS credits_remaining
      FROM res
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  if (!rows.length) return null;
  return {
    reservationId: rows[0].reservation_id,
    creditsRemaining: rows[0].credits_remaining === null ? null : Number(rows[0].credits_remaining)
  };
}
async function releaseSpot(params) {
  const { reservationId, newStatus, cancelledBy } = params;
  const result = await db.execute(sql10`
    WITH res AS (
      UPDATE reservations
         SET status = ${newStatus}::reservation_status,
             cancelled_at = now(),
             cancelled_by = ${cancelledBy}::uuid,
             updated_at = now()
       WHERE id = ${reservationId}::uuid
         AND status = 'booked'
      RETURNING id, session_id, membership_id, credit_charged
    ),
    freed AS (
      UPDATE class_sessions
         SET booked_count = GREATEST(0, booked_count - 1),
             updated_at = now()
       WHERE id = (SELECT session_id FROM res)
      RETURNING id
    )
    SELECT session_id, membership_id, credit_charged FROM res
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  if (!rows.length) return null;
  return {
    sessionId: rows[0].session_id,
    membershipId: rows[0].membership_id,
    creditCharged: rows[0].credit_charged
  };
}
async function refundCredit(params) {
  const { reservationId, membershipId, studentId, reason, note } = params;
  const result = await db.execute(sql10`
    WITH tx AS (
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, reservation_id, note)
      VALUES (${membershipId}::uuid, ${studentId}::uuid, 1, ${reason}::credit_reason,
              ${reservationId}::uuid, ${note ?? null})
      ON CONFLICT (reservation_id, reason) WHERE reservation_id IS NOT NULL DO NOTHING
      RETURNING id
    ),
    restored AS (
      UPDATE memberships
         SET credits_used = GREATEST(0, credits_used - 1),
             status = CASE WHEN status = 'depleted' THEN 'active' ELSE status END,
             updated_at = now()
       WHERE id = ${membershipId}::uuid
         AND EXISTS (SELECT 1 FROM tx)
      RETURNING id
    )
    SELECT count(*)::int AS refunded FROM restored
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  return (rows[0]?.refunded ?? 0) > 0;
}
async function forfeitCredit(params) {
  await db.execute(sql10`
    INSERT INTO credit_transactions (membership_id, student_id, delta, reason, reservation_id, note)
    VALUES (${params.membershipId}::uuid, ${params.studentId}::uuid, 0,
            ${params.reason}::credit_reason, ${params.reservationId}::uuid, ${params.note ?? null})
    ON CONFLICT (reservation_id, reason) WHERE reservation_id IS NOT NULL DO NOTHING
  `);
}

// server/services/booking.service.ts
init_settings_service();
async function findEligibleMembership(studentId, session) {
  const result = await db.execute(sql11`
    SELECT m.id,
           m.plan_id,
           p.name AS plan_name,
           p.segment::text AS segment,
           (m.credits_total - m.credits_used) AS credits_remaining,
           m.ends_on::text AS ends_on
      FROM memberships m
      JOIN plans p ON p.id = m.plan_id
     WHERE m.student_id = ${studentId}::uuid
       AND m.status = 'active'
       AND m.ends_on >= (now() AT TIME ZONE 'America/Santiago')::date
       AND m.credits_used < m.credits_total
       AND (
         NOT EXISTS (SELECT 1 FROM plan_class_types pct WHERE pct.plan_id = p.id)
         OR EXISTS (
           SELECT 1 FROM plan_class_types pct
            WHERE pct.plan_id = p.id AND pct.class_type_id = ${session.classTypeId}::uuid
         )
       )
       AND (p.allowed_weekdays IS NULL
            OR EXTRACT(DOW FROM ${session.localDate}::date)::smallint = ANY(p.allowed_weekdays))
       AND (p.allowed_time_from IS NULL OR ${session.startTime}::time >= p.allowed_time_from)
       AND (p.allowed_time_to   IS NULL OR ${session.startTime}::time <= p.allowed_time_to)
     ORDER BY m.ends_on ASC, credits_remaining ASC
     LIMIT 1
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    planId: r.plan_id,
    planName: r.plan_name,
    segment: r.segment,
    creditsRemaining: Number(r.credits_remaining),
    endsOn: r.ends_on
  };
}
async function explainIneligibility(studentId, session) {
  const result = await db.execute(sql11`
    SELECT p.name,
           p.segment::text AS segment,
           (m.credits_total - m.credits_used) AS credits_remaining,
           m.ends_on::text AS ends_on,
           m.status::text AS status,
           p.allowed_weekdays,
           p.allowed_time_from::text AS allowed_time_from,
           p.allowed_time_to::text AS allowed_time_to,
           (NOT EXISTS (SELECT 1 FROM plan_class_types pct WHERE pct.plan_id = p.id)
            OR EXISTS (SELECT 1 FROM plan_class_types pct
                        WHERE pct.plan_id = p.id AND pct.class_type_id = ${session.classTypeId}::uuid)
           ) AS covers_class
      FROM memberships m
      JOIN plans p ON p.id = m.plan_id
     WHERE m.student_id = ${studentId}::uuid
       AND m.status IN ('active','pending_verification')
     ORDER BY m.ends_on DESC
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  if (!rows.length) {
    fail("NO_ACTIVE_PLAN", "No tienes un plan activo. Compra uno o reserva esta clase suelta.");
  }
  const pending = rows.find((r) => r.status === "pending_verification");
  if (pending) {
    fail(
      "NO_ACTIVE_PLAN",
      `Tu plan ${pending.name} est\xE1 esperando que verifiquemos tu certificado de alumno regular.`
    );
  }
  const withCredits = rows.filter((r) => Number(r.credits_remaining) > 0);
  if (!withCredits.length) {
    fail("NO_CREDITS", "Te quedaste sin cr\xE9ditos. Renueva tu plan para seguir reservando.");
  }
  const timeRestricted = withCredits.find((r) => r.allowed_weekdays !== null || r.allowed_time_from !== null);
  if (timeRestricted) {
    const dias = (timeRestricted.allowed_weekdays ?? []).map(weekdayName).join(", ");
    const desde = timeRestricted.allowed_time_from ? hhmm(timeRestricted.allowed_time_from) : null;
    const hasta = timeRestricted.allowed_time_to ? hhmm(timeRestricted.allowed_time_to) : null;
    const franja = desde && hasta ? ` entre las ${desde} y las ${hasta}` : "";
    fail(
      "PLAN_TIME_RESTRICTED",
      `Tu plan ${timeRestricted.name} s\xF3lo permite reservar los ${dias}${franja}. Esta clase queda fuera de tu horario.`
    );
  }
  const notCovering = withCredits.find((r) => !r.covers_class);
  if (notCovering) {
    fail("PLAN_NOT_APPLICABLE", `Tu plan ${notCovering.name} no incluye este tipo de clase.`);
  }
  throw new DomainError("NO_ACTIVE_PLAN", "Ninguno de tus planes cubre esta clase.");
}
async function getSessionForBooking(sessionId) {
  const [row] = await db.select({
    id: classSessions.id,
    classTypeId: classSessions.classTypeId,
    className: classTypes.name,
    localDate: classSessions.localDate,
    startTime: classSessions.startTime,
    startsAt: classSessions.startsAt,
    capacity: classSessions.capacity,
    bookedCount: classSessions.bookedCount,
    status: classSessions.status
  }).from(classSessions).innerJoin(classTypes, eq6(classTypes.id, classSessions.classTypeId)).where(eq6(classSessions.id, sessionId)).limit(1);
  if (!row) fail("NOT_FOUND", "Esa clase no existe.");
  return row;
}
async function createBooking(studentId, sessionId, source = "web") {
  const settings2 = await getSettings();
  const session = await getSessionForBooking(sessionId);
  if (session.status === "cancelled") fail("SESSION_CANCELLED", "Esa clase fue cancelada.");
  if (session.startsAt.getTime() <= Date.now() + settings2.booking_closes_minutes_before * 6e4) {
    fail("SESSION_CLOSED", `La reserva se cierra ${settings2.booking_closes_minutes_before} minutos antes de la clase.`);
  }
  const dayCount = await db.execute(sql11`
    SELECT count(*)::int AS n
      FROM reservations r
      JOIN class_sessions s ON s.id = r.session_id
     WHERE r.student_id = ${studentId}::uuid
       AND s.local_date = ${session.localDate}::date
       AND r.status IN ('booked','attended')
  `);
  const dayRows = Array.isArray(dayCount) ? dayCount : dayCount.rows;
  const membership = await findEligibleMembership(studentId, session);
  if (!membership) await explainIneligibility(studentId, session);
  const [plan] = await db.select({ maxPerDay: plans.maxBookingsPerDay }).from(plans).where(eq6(plans.id, membership.planId)).limit(1);
  if (plan && (dayRows[0]?.n ?? 0) >= plan.maxPerDay) {
    fail("DAILY_LIMIT", `Tu plan permite ${plan.maxPerDay} clase(s) por d\xEDa.`);
  }
  if (session.bookedCount >= session.capacity) {
    fail("SESSION_FULL", "La clase est\xE1 llena. Puedes entrar a la lista de espera.");
  }
  const booked = await bookSpot({
    sessionId,
    studentId,
    membershipId: membership.id,
    closeMinutesBefore: settings2.booking_closes_minutes_before,
    source
  });
  if (!booked) {
    const fresh = await getSessionForBooking(sessionId);
    if (fresh.bookedCount >= fresh.capacity) {
      fail("SESSION_FULL", "Alguien tom\xF3 el \xFAltimo cupo justo antes que t\xFA. Puedes entrar a la lista de espera.");
    }
    if (fresh.status === "cancelled") fail("SESSION_CANCELLED", "Esa clase fue cancelada.");
    fail("CONFLICT", "No se pudo completar la reserva. Vuelve a intentarlo.");
  }
  return {
    reservationId: booked.reservationId,
    creditsRemaining: booked.creditsRemaining,
    membership,
    session
  };
}
async function cancelBooking(reservationId, actorId, opts = {}) {
  const settings2 = await getSettings();
  const [row] = await db.select({
    id: reservations.id,
    studentId: reservations.studentId,
    membershipId: reservations.membershipId,
    creditCharged: reservations.creditCharged,
    status: reservations.status,
    startsAt: classSessions.startsAt,
    sessionId: classSessions.id
  }).from(reservations).innerJoin(classSessions, eq6(classSessions.id, reservations.sessionId)).where(eq6(reservations.id, reservationId)).limit(1);
  if (!row) fail("NOT_FOUND", "Esa reserva no existe.");
  if (row.status !== "booked") fail("CONFLICT", "Esa reserva ya no est\xE1 activa.");
  const hoursToStart = (row.startsAt.getTime() - Date.now()) / 36e5;
  const alreadyStarted = hoursToStart <= 0;
  const isLate = hoursToStart < settings2.late_cancel_hours;
  if (alreadyStarted && !opts.asStudio && !opts.waivePenalty) {
    fail("TOO_LATE_TO_CANCEL", "La clase ya empez\xF3. Escr\xEDbenos si necesitas ayuda.");
  }
  const newStatus = opts.asStudio ? "studio_cancelled" : isLate && !opts.waivePenalty ? "late_cancelled" : "cancelled";
  const released = await releaseSpot({ reservationId, newStatus, cancelledBy: actorId });
  if (!released) fail("CONFLICT", "Esa reserva ya fue cancelada.");
  let refunded = false;
  if (released.creditCharged && released.membershipId) {
    if (opts.asStudio) {
      refunded = await refundCredit({
        reservationId,
        membershipId: released.membershipId,
        studentId: row.studentId,
        reason: "studio_cancel_refund",
        note: "Clase cancelada por el estudio"
      });
    } else if (!isLate || opts.waivePenalty) {
      refunded = await refundCredit({
        reservationId,
        membershipId: released.membershipId,
        studentId: row.studentId,
        reason: "cancellation_refund",
        note: opts.waivePenalty ? "Cancelaci\xF3n tard\xEDa perdonada por el estudio" : void 0
      });
    } else {
      await forfeitCredit({
        reservationId,
        membershipId: released.membershipId,
        studentId: row.studentId,
        reason: "late_cancel_forfeit",
        note: `Cancelada a ${hoursToStart.toFixed(1)} h del inicio`
      });
    }
  }
  const message = opts.asStudio ? "Clase cancelada por el estudio. Te devolvimos el cr\xE9dito." : refunded ? "Reserva cancelada. Te devolvimos el cr\xE9dito." : `Reserva cancelada. Como faltaban menos de ${settings2.late_cancel_hours} horas, el cr\xE9dito no se devuelve.`;
  return { refunded, wasLate: isLate, message };
}

// server/routes/student.routes.ts
init_email_service();

// server/services/waitlist.service.ts
init_client();
import { sql as sql12 } from "drizzle-orm";
init_email_service();
init_settings_service();
async function promoteFromWaitlist(sessionId, maxAttempts = 5) {
  const settings2 = await getSettings();
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await db.execute(sql12`
      SELECT w.id, w.student_id, w.auto_book,
             s.class_type_id, s.local_date::text AS local_date, s.start_time::text AS start_time,
             s.booked_count, s.capacity, s.starts_at,
             u.email, u.first_name,
             ct.name AS class_name
        FROM waitlist_entries w
        JOIN class_sessions s ON s.id = w.session_id
        JOIN users u ON u.id = w.student_id
        JOIN class_types ct ON ct.id = s.class_type_id
       WHERE w.session_id = ${sessionId}::uuid
         AND w.status = 'waiting'
         AND s.status = 'scheduled'
         AND s.booked_count < s.capacity
         AND s.starts_at > now() + (${settings2.booking_closes_minutes_before}::int || ' minutes')::interval
       ORDER BY w.created_at ASC
       LIMIT 1
    `);
    const rows = Array.isArray(result) ? result : result.rows;
    if (!rows.length) return null;
    const entry = rows[0];
    if (!entry.auto_book) {
      await db.execute(sql12`
        UPDATE waitlist_entries
           SET status = 'offered',
               offered_at = now(),
               offer_expires_at = now() + (${settings2.waitlist_offer_minutes}::int || ' minutes')::interval,
               notified_at = now()
         WHERE id = ${entry.id}::uuid
      `);
      await queueTemplate("waitlist_promoted", entry.student_id, entry.email, {
        nombre: entry.first_name,
        clase: entry.class_name,
        fecha: entry.local_date,
        hora: entry.start_time.slice(0, 5),
        minutos: settings2.waitlist_offer_minutes
      });
      return entry.id;
    }
    const membership = await findEligibleMembership(entry.student_id, {
      id: sessionId,
      classTypeId: entry.class_type_id,
      localDate: entry.local_date,
      startTime: entry.start_time
    });
    if (!membership) {
      await db.execute(sql12`
        UPDATE waitlist_entries
           SET status = 'expired', expired_reason = 'Sin plan vigente que cubra esta clase'
         WHERE id = ${entry.id}::uuid
      `);
      continue;
    }
    const booked = await bookSpot({
      sessionId,
      studentId: entry.student_id,
      membershipId: membership.id,
      closeMinutesBefore: settings2.booking_closes_minutes_before,
      source: "waitlist"
    });
    if (!booked) {
      return null;
    }
    await db.execute(sql12`
      UPDATE waitlist_entries
         SET status = 'promoted', promoted_at = now(), reservation_id = ${booked.reservationId}::uuid
       WHERE id = ${entry.id}::uuid
    `);
    await db.execute(sql12`
      UPDATE class_sessions
         SET waitlist_count = GREATEST(0, waitlist_count - 1)
       WHERE id = ${sessionId}::uuid
    `);
    await queueTemplate("waitlist_promoted", entry.student_id, entry.email, {
      nombre: entry.first_name,
      clase: entry.class_name,
      fecha: entry.local_date,
      hora: entry.start_time.slice(0, 5)
    });
    return booked.reservationId;
  }
  return null;
}
async function joinWaitlist(sessionId, studentId) {
  const result = await db.execute(sql12`
    WITH ins AS (
      INSERT INTO waitlist_entries (session_id, student_id)
      SELECT ${sessionId}::uuid, ${studentId}::uuid
        FROM class_sessions s
       WHERE s.id = ${sessionId}::uuid
         AND s.status = 'scheduled'
         AND s.booked_count >= s.capacity
      ON CONFLICT (session_id, student_id) WHERE status IN ('waiting','offered') DO NOTHING
      RETURNING id
    ),
    bump AS (
      UPDATE class_sessions
         SET waitlist_count = waitlist_count + 1
       WHERE id = ${sessionId}::uuid AND EXISTS (SELECT 1 FROM ins)
      RETURNING id
    )
    SELECT id FROM ins
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  return rows[0]?.id ?? null;
}
async function leaveWaitlist(sessionId, studentId) {
  const result = await db.execute(sql12`
    WITH gone AS (
      UPDATE waitlist_entries
         SET status = 'cancelled'
       WHERE session_id = ${sessionId}::uuid
         AND student_id = ${studentId}::uuid
         AND status IN ('waiting','offered')
      RETURNING id
    ),
    bump AS (
      UPDATE class_sessions
         SET waitlist_count = GREATEST(0, waitlist_count - 1)
       WHERE id = ${sessionId}::uuid AND EXISTS (SELECT 1 FROM gone)
      RETURNING id
    )
    SELECT count(*)::int AS n FROM gone
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  return (rows[0]?.n ?? 0) > 0;
}
async function waitlistPosition(sessionId, studentId) {
  const result = await db.execute(sql12`
    SELECT position FROM (
      SELECT student_id, row_number() OVER (ORDER BY created_at ASC)::int AS position
        FROM waitlist_entries
       WHERE session_id = ${sessionId}::uuid AND status = 'waiting'
    ) q WHERE student_id = ${studentId}::uuid
  `);
  const rows = Array.isArray(result) ? result : result.rows;
  return rows[0]?.position ?? null;
}

// server/routes/student.routes.ts
var studentRouter = Router3();
var rowsOf = (r) => Array.isArray(r) ? r : r.rows;
studentRouter.get(
  "/me/dashboard",
  requireAuth,
  wrap(async (req, res) => {
    const uid = req.user.id;
    const memberships3 = rowsOf(
      await db.execute(sql13`
        SELECT m.id, p.name AS "planName", p.segment::text AS segment,
               m.credits_total AS "creditsTotal", m.credits_used AS "creditsUsed",
               (m.credits_total - m.credits_used) AS "creditsRemaining",
               m.ends_on::text AS "endsOn", m.status::text AS status,
               (m.ends_on - (now() AT TIME ZONE 'America/Santiago')::date)::int AS "daysLeft",
               p.allowed_weekdays AS "allowedWeekdays",
               p.allowed_time_from::text AS "allowedTimeFrom",
               p.allowed_time_to::text AS "allowedTimeTo"
          FROM memberships m JOIN plans p ON p.id = m.plan_id
         WHERE m.student_id = ${uid}::uuid AND m.status IN ('active','pending_verification')
         ORDER BY m.ends_on ASC
      `)
    );
    const upcoming = rowsOf(
      await db.execute(sql13`
        SELECT r.id, r.status::text AS status,
               s.id AS "sessionId", s.local_date::text AS "localDate",
               s.start_time::text AS "startTime", s.starts_at AS "startsAt",
               ct.name AS "className",
               COALESCE(i.first_name, 'Por confirmar') AS "instructorName",
               rm.name AS "roomName"
          FROM reservations r
          JOIN class_sessions s ON s.id = r.session_id
          JOIN class_types ct ON ct.id = s.class_type_id
          JOIN rooms rm ON rm.id = s.room_id
          LEFT JOIN users i ON i.id = s.instructor_id
         WHERE r.student_id = ${uid}::uuid AND r.status = 'booked' AND s.starts_at > now()
         ORDER BY s.starts_at ASC LIMIT 5
      `)
    );
    const waiting = rowsOf(
      await db.execute(sql13`
        SELECT w.id, w.status::text AS status, s.id AS "sessionId",
               s.local_date::text AS "localDate", s.start_time::text AS "startTime",
               ct.name AS "className"
          FROM waitlist_entries w
          JOIN class_sessions s ON s.id = w.session_id
          JOIN class_types ct ON ct.id = s.class_type_id
         WHERE w.student_id = ${uid}::uuid AND w.status IN ('waiting','offered') AND s.starts_at > now()
         ORDER BY s.starts_at ASC
      `)
    );
    res.json({ data: { memberships: memberships3, upcoming, waitlist: waiting } });
  })
);
studentRouter.get(
  "/me/memberships",
  requireAuth,
  wrap(async (req, res) => {
    const rows = rowsOf(
      await db.execute(sql13`
        SELECT m.id, p.name AS "planName", p.segment::text AS segment, p.credits AS "planCredits",
               m.credits_total AS "creditsTotal", m.credits_used AS "creditsUsed",
               (m.credits_total - m.credits_used) AS "creditsRemaining",
               m.starts_on::text AS "startsOn", m.ends_on::text AS "endsOn",
               m.status::text AS status, m.price_paid_clp AS "pricePaidClp"
          FROM memberships m JOIN plans p ON p.id = m.plan_id
         WHERE m.student_id = ${req.user.id}::uuid
         ORDER BY m.starts_on DESC
      `)
    );
    res.json({ data: rows });
  })
);
studentRouter.get(
  "/me/credits",
  requireAuth,
  wrap(async (req, res) => {
    const rows = rowsOf(
      await db.execute(sql13`
        SELECT ct.id, ct.delta, ct.reason::text AS reason, ct.note,
               ct.created_at AS "createdAt", ct.balance_after AS "balanceAfter",
               cls.name AS "className", s.local_date::text AS "localDate", s.start_time::text AS "startTime"
          FROM credit_transactions ct
          LEFT JOIN reservations r ON r.id = ct.reservation_id
          LEFT JOIN class_sessions s ON s.id = r.session_id
          LEFT JOIN class_types cls ON cls.id = s.class_type_id
         WHERE ct.student_id = ${req.user.id}::uuid
         ORDER BY ct.created_at DESC LIMIT 100
      `)
    );
    res.json({ data: rows });
  })
);
studentRouter.get(
  "/me/reservations",
  requireAuth,
  wrap(async (req, res) => {
    const scope = req.query.scope === "past" ? "past" : "upcoming";
    const rows = rowsOf(
      await db.execute(sql13`
        SELECT r.id, r.status::text AS status, r.booked_at AS "bookedAt",
               r.checked_in_at AS "checkedInAt", r.credit_charged AS "creditCharged",
               s.id AS "sessionId", s.local_date::text AS "localDate",
               s.start_time::text AS "startTime", s.starts_at AS "startsAt",
               ct.name AS "className",
               COALESCE(i.first_name, 'Por confirmar') AS "instructorName",
               rm.name AS "roomName",
               EXTRACT(EPOCH FROM (s.starts_at - now()))/3600 AS "hoursToStart"
          FROM reservations r
          JOIN class_sessions s ON s.id = r.session_id
          JOIN class_types ct ON ct.id = s.class_type_id
          JOIN rooms rm ON rm.id = s.room_id
          LEFT JOIN users i ON i.id = s.instructor_id
         WHERE r.student_id = ${req.user.id}::uuid
           AND (${scope} = 'upcoming' AND s.starts_at > now() AND r.status = 'booked'
                OR ${scope} = 'past' AND (s.starts_at <= now() OR r.status <> 'booked'))
         ORDER BY s.starts_at ${scope === "past" ? sql13`DESC` : sql13`ASC`}
         LIMIT 100
      `)
    );
    res.json({ data: rows });
  })
);
studentRouter.get(
  "/me/orders",
  requireAuth,
  wrap(async (req, res) => {
    const rows = rowsOf(
      await db.execute(sql13`
        SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
               o.total_clp AS "totalClp", o.paid_at AS "paidAt", o.created_at AS "createdAt",
               (SELECT string_agg(oi.description, ', ') FROM order_items oi WHERE oi.order_id = o.id) AS items
          FROM orders o
         WHERE o.student_id = ${req.user.id}::uuid
         ORDER BY o.created_at DESC LIMIT 50
      `)
    );
    res.json({ data: rows });
  })
);
var bookingSchema = z4.object({ sessionId: z4.string().uuid() });
studentRouter.post(
  "/bookings",
  requireAuth,
  wrap(async (req, res) => {
    const { sessionId } = bookingSchema.parse(req.body);
    const result = await createBooking(req.user.id, sessionId);
    await queueTemplate("booking_confirmed", req.user.id, req.user.email, {
      nombre: req.user.firstName,
      clase: result.session.className,
      fecha: result.session.localDate,
      hora: result.session.startTime.slice(0, 5),
      creditos: result.creditsRemaining
    });
    res.status(201).json({
      data: {
        reservationId: result.reservationId,
        creditsRemaining: result.creditsRemaining,
        plan: result.membership.planName,
        message: `Reservaste ${result.session.className}. Te quedan ${result.creditsRemaining} cr\xE9ditos.`
      }
    });
  })
);
studentRouter.delete(
  "/bookings/:id",
  requireAuth,
  wrap(async (req, res) => {
    const [own] = rowsOf(
      await db.execute(sql13`SELECT student_id, session_id FROM reservations WHERE id = ${req.params.id}::uuid`)
    );
    if (!own || own.student_id !== req.user.id) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa reserva no existe." } });
    }
    const outcome = await cancelBooking(req.params.id, req.user.id);
    const promoted = await promoteFromWaitlist(own.session_id);
    await queueTemplate("booking_cancelled", req.user.id, req.user.email, {
      nombre: req.user.firstName,
      devuelto: outcome.refunded ? "s\xED" : "no"
    });
    res.json({ data: { ...outcome, waitlistPromoted: Boolean(promoted) } });
  })
);
studentRouter.post(
  "/sessions/:id/waitlist",
  requireAuth,
  wrap(async (req, res) => {
    const session = await getSessionForBooking(req.params.id);
    if (session.bookedCount < session.capacity) {
      return res.status(409).json({
        error: { code: "CONFLICT", message: "Todav\xEDa quedan cupos: reserva directamente." }
      });
    }
    const membership = await findEligibleMembership(req.user.id, session);
    const entryId = await joinWaitlist(req.params.id, req.user.id);
    if (!entryId) {
      return res.status(409).json({ error: { code: "CONFLICT", message: "Ya est\xE1s en la lista de espera." } });
    }
    const position = await waitlistPosition(req.params.id, req.user.id);
    res.status(201).json({
      data: {
        position,
        warning: membership ? null : "Est\xE1s en la lista, pero necesitar\xE1s cr\xE9ditos vigentes para tomar el cupo."
      }
    });
  })
);
studentRouter.delete(
  "/sessions/:id/waitlist",
  requireAuth,
  wrap(async (req, res) => {
    const left = await leaveWaitlist(req.params.id, req.user.id);
    if (!left) return res.status(404).json({ error: { code: "NOT_ON_WAITLIST", message: "No estabas en la lista." } });
    res.json({ data: { ok: true } });
  })
);

// server/routes/payments.routes.ts
init_env();
import { Router as Router4 } from "express";
import { z as z5 } from "zod";

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

// server/routes/payments.routes.ts
init_order_service();

// server/services/payment.service.ts
init_client();
init_order_service();
import { sql as sql15 } from "drizzle-orm";
var rowsOf3 = (r) => Array.isArray(r) ? r : r.rows;
async function applyWebhookEvent(provider, event) {
  const inserted = rowsOf3(
    await db.execute(sql15`
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
  await db.execute(sql15`
    UPDATE payments
       SET status = ${newStatus}::payment_status,
           paid_at = CASE WHEN ${newStatus} = 'paid' THEN now() ELSE paid_at END,
           updated_at = now()
     WHERE provider = ${provider} AND provider_payment_id = ${event.providerPaymentId}
  `);
  const [payment] = rowsOf3(
    await db.execute(sql15`
      SELECT order_id FROM payments WHERE provider = ${provider} AND provider_payment_id = ${event.providerPaymentId}
    `)
  );
  const orderId = payment?.order_id ?? event.orderId;
  if (!orderId) return { duplicated: false, applied: false };
  if (newStatus === "paid") {
    await db.execute(sql15`
      UPDATE orders SET status = 'paid', paid_at = now(), updated_at = now()
       WHERE id = ${orderId}::uuid AND status <> 'paid'
    `);
    await fulfillOrder(orderId);
  } else if (newStatus === "failed" || newStatus === "expired") {
    await db.execute(sql15`
      UPDATE orders SET status = ${newStatus === "failed" ? "failed" : "expired"}::order_status, updated_at = now()
       WHERE id = ${orderId}::uuid AND status = 'awaiting_payment'
    `);
    await db.execute(sql15`
      WITH freed AS (
        UPDATE reservations SET status = 'cancelled', cancelled_at = now()
         WHERE order_id = ${orderId}::uuid AND status = 'booked' AND membership_id IS NULL
        RETURNING session_id
      )
      UPDATE class_sessions s SET booked_count = GREATEST(0, s.booked_count - 1)
        FROM freed WHERE s.id = freed.session_id
    `);
  }
  await db.execute(sql15`
    UPDATE payment_events SET processed_at = now() WHERE id = ${inserted[0].id}
  `);
  return { duplicated: false, applied: true, orderId, status: newStatus };
}
async function createPaymentRecord(params) {
  await db.execute(sql15`
    INSERT INTO payments (order_id, provider, provider_payment_id, status, amount_clp, redirect_url)
    VALUES (${params.orderId}::uuid, ${params.provider}, ${params.providerPaymentId}, 'pending',
            ${params.amountClp}, ${params.redirectUrl})
  `);
  await db.execute(sql15`
    UPDATE orders SET provider = ${params.provider}, updated_at = now() WHERE id = ${params.orderId}::uuid
  `);
}

// server/routes/payments.routes.ts
var paymentsRouter = Router4();
var webhooksRouter = Router4();
var createOrderSchema = z5.object({ planSlug: z5.string().min(1) });
paymentsRouter.post(
  "/orders",
  requireAuth,
  wrap(async (req, res) => {
    const { planSlug } = createOrderSchema.parse(req.body);
    const order = await createPlanOrder(req.user.id, planSlug);
    res.status(201).json({ data: order });
  })
);
paymentsRouter.get(
  "/orders/:id",
  requireAuth,
  wrap(async (req, res) => {
    const order = await getOrder(req.params.id, req.user.role === "owner" ? void 0 : req.user.id);
    res.json({ data: order });
  })
);
paymentsRouter.post(
  "/orders/:id/checkout",
  requireAuth,
  wrap(async (req, res) => {
    const order = await getOrder(req.params.id, req.user.id);
    if (order.status === "paid") {
      return res.json({ data: { alreadyPaid: true, redirectUrl: `/pago/resultado?orderId=${order.id}` } });
    }
    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      orderId: String(order.id),
      orderNumber: String(order.orderNumber),
      amountClp: Number(order.totalClp),
      description: order.items?.[0]?.description ?? "Plan Pink Pilates",
      customer: {
        id: req.user.id,
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`
      },
      returnUrl: `${appUrl()}/pago/resultado?orderId=${order.id}`,
      cancelUrl: `${appUrl()}/planes`,
      webhookUrl: `${appUrl()}/api/webhooks/payments/${provider.id}`,
      idempotencyKey: `order-${order.id}`
    });
    await createPaymentRecord({
      orderId: String(order.id),
      provider: provider.id,
      providerPaymentId: session.providerPaymentId,
      amountClp: Number(order.totalClp),
      redirectUrl: session.redirectUrl
    });
    res.json({ data: { redirectUrl: session.redirectUrl, provider: provider.id } });
  })
);
paymentsRouter.get(
  "/payments/mock/:token",
  wrap(async (req, res) => {
    const payload = mock.readToken(req.params.token);
    if (!payload) {
      return res.status(410).json({ error: { code: "ORDER_EXPIRED", message: "Este enlace de pago venci\xF3." } });
    }
    res.json({ data: payload });
  })
);
paymentsRouter.post(
  "/payments/mock/:token/:outcome",
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
webhooksRouter.post(
  "/payments/:provider",
  wrap(async (req, res) => {
    const provider = getPaymentProvider(req.params.provider);
    const event = await provider.parseWebhook({
      headers: req.headers,
      rawBody: Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {})),
      query: req.query
    });
    if (!event.signatureValid) {
      return res.status(401).json({ error: { code: "FORBIDDEN", message: "Firma inv\xE1lida." } });
    }
    const result = await applyWebhookEvent(provider.id, event);
    res.json({ data: result });
  })
);

// server/routes/admin.routes.ts
init_client();
import { Router as Router5 } from "express";
import { sql as sql16 } from "drizzle-orm";
import { z as z6 } from "zod";
init_email_service();
var adminRouter = Router5();
var owner = requireRole("owner");
var staff = requireRole("owner", "instructor");
var rowsOf4 = (r) => Array.isArray(r) ? r : r.rows;
var one = async (q) => rowsOf4(await db.execute(q))[0];
adminRouter.get(
  "/overview",
  owner,
  wrap(async (_req, res) => {
    const kpis = await one(sql16`
      SELECT
        (SELECT COALESCE(sum(total_clp),0)::int FROM orders
          WHERE status='paid'
            AND (paid_at AT TIME ZONE 'America/Santiago')
                >= date_trunc('month', now() AT TIME ZONE 'America/Santiago')) AS "ingresosMes",
        -- Mismo tramo de dias del mes anterior, no el mes completo: comparar el
        -- dia 2 de septiembre contra todo agosto siempre daria una caida falsa.
        (SELECT COALESCE(sum(total_clp),0)::int FROM orders
          WHERE status='paid'
            AND (paid_at AT TIME ZONE 'America/Santiago')
                >= date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - INTERVAL '1 month')
            AND (paid_at AT TIME ZONE 'America/Santiago')
                <  date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - INTERVAL '1 month')
                   + ((now() AT TIME ZONE 'America/Santiago') - date_trunc('month', now() AT TIME ZONE 'America/Santiago'))
          ) AS "ingresosMesAnterior",
        (SELECT count(*)::int FROM reservations r JOIN class_sessions s ON s.id=r.session_id
          WHERE r.status IN ('booked','attended')
            AND s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date
            AND s.local_date <  (now() AT TIME ZONE 'America/Santiago')::date + 7) AS "reservasSemana",
        (SELECT count(DISTINCT student_id)::int FROM memberships
          WHERE status='active' AND ends_on >= (now() AT TIME ZONE 'America/Santiago')::date) AS "alumnasActivas",
        (SELECT count(*)::int FROM memberships
          WHERE status='active' AND ends_on BETWEEN (now() AT TIME ZONE 'America/Santiago')::date
            AND (now() AT TIME ZONE 'America/Santiago')::date + 7) AS "planesPorVencer",
        (SELECT count(*)::int FROM memberships WHERE status='pending_verification') AS "porVerificar",
        (SELECT count(*)::int FROM reservations r JOIN class_sessions s ON s.id=r.session_id
          WHERE r.status='no_show' AND s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30) AS "noShowsMes",
        (SELECT count(*)::int FROM contact_leads WHERE status='new') AS "contactosNuevos"
    `);
    const ocupacion = await one(sql16`
      SELECT COALESCE(sum(booked_count),0)::int AS ocupadas, COALESCE(sum(capacity),0)::int AS ofrecidas
        FROM class_sessions
       WHERE status='scheduled'
         AND local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30
         AND local_date <  (now() AT TIME ZONE 'America/Santiago')::date
    `);
    const hoy = rowsOf4(await db.execute(sql16`
      SELECT s.id, s.start_time::text AS "startTime", ct.name AS "className", ct.color,
             s.booked_count AS "bookedCount", s.capacity, s.waitlist_count AS "waitlistCount",
             rm.name AS "roomName", COALESCE(i.first_name,'Sin asignar') AS "instructorName",
             s.status::text AS status
        FROM class_sessions s
        JOIN class_types ct ON ct.id=s.class_type_id
        JOIN rooms rm ON rm.id=s.room_id
        LEFT JOIN users i ON i.id=s.instructor_id
       WHERE s.local_date = (now() AT TIME ZONE 'America/Santiago')::date
       ORDER BY s.start_time
    `));
    const ingresos = rowsOf4(await db.execute(sql16`
      SELECT to_char(date_trunc('month', paid_at AT TIME ZONE 'America/Santiago'),'YYYY-MM') AS mes,
             sum(total_clp)::int AS total, count(*)::int AS ordenes
        FROM orders WHERE status='paid' AND paid_at >= now() - INTERVAL '6 months'
       GROUP BY 1 ORDER BY 1
    `));
    const porClase = rowsOf4(await db.execute(sql16`
      SELECT ct.name AS clase, ct.color,
             COALESCE(sum(s.booked_count),0)::int AS reservas,
             COALESCE(sum(s.capacity),0)::int AS cupos,
             CASE WHEN sum(s.capacity) > 0
                  THEN round(100.0 * sum(s.booked_count) / sum(s.capacity))::int ELSE 0 END AS ocupacion
        FROM class_sessions s JOIN class_types ct ON ct.id=s.class_type_id
       WHERE s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30
         AND s.local_date < (now() AT TIME ZONE 'America/Santiago')::date
       GROUP BY ct.name, ct.color ORDER BY reservas DESC
    `));
    res.json({
      data: {
        ...kpis,
        ocupacionPct: ocupacion.ofrecidas ? Math.round(100 * ocupacion.ocupadas / ocupacion.ofrecidas) : 0,
        clasesHoy: hoy,
        ingresosPorMes: ingresos,
        ocupacionPorClase: porClase
      }
    });
  })
);
adminRouter.get(
  "/calendar",
  staff,
  wrap(async (req, res) => {
    const from = z6.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().parse(req.query.from);
    const to = z6.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().parse(req.query.to);
    const rows = rowsOf4(await db.execute(sql16`
      SELECT s.id, s.local_date::text AS "localDate", s.start_time::text AS "startTime",
             s.starts_at AS "startsAt", s.duration_min AS "durationMin",
             s.capacity, s.booked_count AS "bookedCount", s.waitlist_count AS "waitlistCount",
             s.status::text AS status, s.notes,
             ct.id AS "classTypeId", ct.name AS "className", ct.color,
             rm.id AS "roomId", rm.name AS "roomName",
             i.id AS "instructorId", COALESCE(i.first_name || ' ' || i.last_name, 'Sin asignar') AS "instructorName"
        FROM class_sessions s
        JOIN class_types ct ON ct.id=s.class_type_id
        JOIN rooms rm ON rm.id=s.room_id
        LEFT JOIN users i ON i.id=s.instructor_id
       WHERE s.local_date >= COALESCE(${from ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date)
         AND s.local_date <= COALESCE(${to ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date + 6)
       ORDER BY s.starts_at
    `));
    res.json({ data: rows });
  })
);
adminRouter.get(
  "/sessions/:id/roster",
  staff,
  wrap(async (req, res) => {
    const session = await one(sql16`
      SELECT s.id, s.local_date::text AS "localDate", s.start_time::text AS "startTime",
             s.starts_at AS "startsAt", s.capacity, s.booked_count AS "bookedCount",
             s.status::text AS status, s.notes,
             ct.name AS "className", rm.name AS "roomName",
             COALESCE(i.first_name || ' ' || i.last_name, 'Sin asignar') AS "instructorName"
        FROM class_sessions s
        JOIN class_types ct ON ct.id=s.class_type_id
        JOIN rooms rm ON rm.id=s.room_id
        LEFT JOIN users i ON i.id=s.instructor_id
       WHERE s.id=${req.params.id}::uuid
    `);
    if (!session) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa clase no existe." } });
    const inscritas = rowsOf4(await db.execute(sql16`
      SELECT r.id, r.status::text AS status, r.checked_in_at AS "checkedInAt", r.source::text AS source,
             u.id AS "studentId", u.first_name AS "firstName", u.last_name AS "lastName", u.phone,
             p.name AS "planName", (m.credits_total - m.credits_used) AS "creditsRemaining",
             (SELECT count(*)::int FROM reservations rr
               WHERE rr.student_id=u.id AND rr.status='no_show') AS "noShowsTotal"
        FROM reservations r
        JOIN users u ON u.id=r.student_id
        LEFT JOIN memberships m ON m.id=r.membership_id
        LEFT JOIN plans p ON p.id=m.plan_id
       WHERE r.session_id=${req.params.id}::uuid AND r.status IN ('booked','attended','no_show')
       ORDER BY u.first_name
    `));
    const espera = rowsOf4(await db.execute(sql16`
      SELECT w.id, w.status::text AS status, w.created_at AS "createdAt",
             u.id AS "studentId", u.first_name AS "firstName", u.last_name AS "lastName"
        FROM waitlist_entries w JOIN users u ON u.id=w.student_id
       WHERE w.session_id=${req.params.id}::uuid AND w.status IN ('waiting','offered')
       ORDER BY w.created_at
    `));
    res.json({ data: { session, inscritas, espera } });
  })
);
var attendanceSchema = z6.object({
  marks: z6.array(z6.object({ reservationId: z6.string().uuid(), present: z6.boolean() }))
});
adminRouter.post(
  "/sessions/:id/attendance",
  staff,
  wrap(async (req, res) => {
    const { marks } = attendanceSchema.parse(req.body);
    for (const m of marks) {
      await db.execute(sql16`
        UPDATE reservations
           SET status = ${m.present ? "attended" : "no_show"}::reservation_status,
               checked_in_at = ${m.present ? sql16`now()` : sql16`NULL`},
               marked_by = ${req.user.id}::uuid, updated_at = now()
         WHERE id = ${m.reservationId}::uuid AND session_id = ${req.params.id}::uuid
      `);
    }
    await db.execute(sql16`UPDATE class_sessions SET status='completed' WHERE id=${req.params.id}::uuid AND starts_at < now()`);
    res.json({ data: { marcadas: marks.length } });
  })
);
adminRouter.post(
  "/sessions/:id/cancel",
  owner,
  wrap(async (req, res) => {
    const reason = z6.string().max(500).optional().parse(req.body?.reason);
    const afectadas = rowsOf4(
      await db.execute(sql16`
        SELECT r.id, r.student_id, u.email, u.first_name
          FROM reservations r JOIN users u ON u.id=r.student_id
         WHERE r.session_id=${req.params.id}::uuid AND r.status='booked'
      `)
    );
    const info = await one(sql16`
      SELECT ct.name AS class_name, s.local_date::text AS local_date, s.start_time::text AS start_time
        FROM class_sessions s JOIN class_types ct ON ct.id=s.class_type_id WHERE s.id=${req.params.id}::uuid
    `);
    for (const r of afectadas) {
      await cancelBooking(r.id, req.user.id, { asStudio: true });
      await queueTemplate("class_cancelled_by_studio", r.student_id, r.email, {
        nombre: r.first_name,
        clase: info.class_name,
        fecha: info.local_date,
        hora: info.start_time.slice(0, 5)
      }, { dedupeKey: `session_cancel:${req.params.id}:${r.student_id}` });
    }
    await db.execute(sql16`
      UPDATE class_sessions
         SET status='cancelled', cancelled_at=now(), cancelled_by=${req.user.id}::uuid,
             cancellation_reason=${reason ?? null}, updated_at=now()
       WHERE id=${req.params.id}::uuid
    `);
    await db.execute(sql16`
      UPDATE waitlist_entries SET status='cancelled'
       WHERE session_id=${req.params.id}::uuid AND status IN ('waiting','offered')
    `);
    await db.execute(sql16`
      INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id, summary)
      VALUES (${req.user.id}::uuid, 'owner', 'session.cancel', 'class_session', ${req.params.id}::uuid,
              ${`Cancel\xF3 ${info.class_name} del ${info.local_date} ${info.start_time.slice(0, 5)}. ${afectadas.length} alumna(s) con cr\xE9dito devuelto.`})
    `);
    res.json({ data: { afectadas: afectadas.length, creditosDevueltos: afectadas.length } });
  })
);
adminRouter.patch(
  "/sessions/:id",
  owner,
  wrap(async (req, res) => {
    const input = z6.object({
      capacity: z6.number().int().min(1).max(50).optional(),
      instructorId: z6.string().uuid().nullable().optional(),
      notes: z6.string().max(1e3).optional()
    }).parse(req.body);
    if (input.capacity !== void 0) {
      const current = await one(sql16`SELECT booked_count FROM class_sessions WHERE id=${req.params.id}::uuid`);
      if (input.capacity < current.booked_count) {
        return res.status(409).json({
          error: { code: "CONFLICT", message: `Ya hay ${current.booked_count} inscritas: el cupo no puede ser menor.` }
        });
      }
      await db.execute(sql16`UPDATE class_sessions SET capacity=${input.capacity}, updated_at=now() WHERE id=${req.params.id}::uuid`);
      await promoteFromWaitlist(req.params.id);
    }
    if (input.instructorId !== void 0) {
      await db.execute(sql16`UPDATE class_sessions SET instructor_id=${input.instructorId}::uuid, updated_at=now() WHERE id=${req.params.id}::uuid`);
    }
    if (input.notes !== void 0) {
      await db.execute(sql16`UPDATE class_sessions SET notes=${input.notes}, updated_at=now() WHERE id=${req.params.id}::uuid`);
    }
    res.json({ data: { ok: true } });
  })
);
adminRouter.post(
  "/sessions/:id/reservations",
  owner,
  wrap(async (req, res) => {
    const { studentId } = z6.object({ studentId: z6.string().uuid() }).parse(req.body);
    const result = await createBooking(studentId, req.params.id, "admin");
    res.status(201).json({ data: result });
  })
);
adminRouter.delete(
  "/reservations/:id",
  owner,
  wrap(async (req, res) => {
    const waive = req.query.waivePenalty === "true";
    const info = await one(sql16`SELECT session_id FROM reservations WHERE id=${req.params.id}::uuid`);
    const outcome = await cancelBooking(req.params.id, req.user.id, { waivePenalty: waive });
    if (info) await promoteFromWaitlist(info.session_id);
    res.json({ data: outcome });
  })
);
adminRouter.get(
  "/students",
  owner,
  wrap(async (req, res) => {
    const q = req.query.q?.trim() || null;
    const estado = req.query.estado || null;
    const rows = rowsOf4(await db.execute(sql16`
      SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
             u.status::text AS status, sp.joined_at AS "joinedAt",
             m.plan_name AS "planName", m.credits_remaining AS "creditsRemaining",
             m.ends_on AS "endsOn", m.membership_status AS "membershipStatus",
             m.days_left AS "daysLeft",
             (SELECT max(s.starts_at) FROM reservations r JOIN class_sessions s ON s.id=r.session_id
               WHERE r.student_id=u.id AND r.status='attended') AS "lastVisit",
             (SELECT count(*)::int FROM reservations r WHERE r.student_id=u.id AND r.status='no_show') AS "noShows",
             (SELECT count(*)::int FROM reservations r WHERE r.student_id=u.id AND r.status='attended') AS "clasesTomadas"
        FROM users u
        LEFT JOIN student_profiles sp ON sp.user_id=u.id
        LEFT JOIN LATERAL (
          SELECT p.name AS plan_name, (mm.credits_total - mm.credits_used) AS credits_remaining,
                 mm.ends_on::text AS ends_on, mm.status::text AS membership_status,
                 (mm.ends_on - (now() AT TIME ZONE 'America/Santiago')::date)::int AS days_left
            FROM memberships mm JOIN plans p ON p.id=mm.plan_id
           WHERE mm.student_id=u.id AND mm.status IN ('active','pending_verification')
           ORDER BY mm.ends_on DESC LIMIT 1
        ) m ON true
       WHERE u.role='student'
         AND (${q}::text IS NULL OR (u.first_name || ' ' || u.last_name || ' ' || u.email) ILIKE '%' || ${q}::text || '%')
         AND (${estado}::text IS NULL
              OR (${estado}::text = 'activas' AND m.membership_status = 'active')
              OR (${estado}::text = 'sin_plan' AND m.membership_status IS NULL)
              OR (${estado}::text = 'por_vencer' AND m.membership_status = 'active' AND m.days_left <= 7)
              OR (${estado}::text = 'por_verificar' AND m.membership_status = 'pending_verification'))
       ORDER BY u.first_name, u.last_name
    `));
    res.json({ data: rows });
  })
);
adminRouter.get(
  "/students/:id",
  owner,
  wrap(async (req, res) => {
    const id = req.params.id;
    const perfil = await one(sql16`
      SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
             u.status::text AS status, u.birth_date::text AS "birthDate", u.last_login_at AS "lastLoginAt",
             sp.emergency_contact_name AS "emergencyContactName", sp.emergency_contact_phone AS "emergencyContactPhone",
             sp.health_notes AS "healthNotes", sp.goals, sp.internal_notes AS "internalNotes",
             sp.marketing_opt_in AS "marketingOptIn", sp.joined_at AS "joinedAt"
        FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.id=${id}::uuid AND u.role='student'
    `);
    if (!perfil) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa alumna no existe." } });
    const [membresias, reservas, creditos, ordenes] = await Promise.all([
      db.execute(sql16`
        SELECT m.id, p.name AS "planName", p.segment::text AS segment, m.status::text AS status,
               m.credits_total AS "creditsTotal", m.credits_used AS "creditsUsed",
               (m.credits_total - m.credits_used) AS "creditsRemaining",
               m.starts_on::text AS "startsOn", m.ends_on::text AS "endsOn", m.price_paid_clp AS "pricePaidClp"
          FROM memberships m JOIN plans p ON p.id=m.plan_id
         WHERE m.student_id=${id}::uuid ORDER BY m.starts_on DESC`),
      db.execute(sql16`
        SELECT r.id, r.status::text AS status, s.local_date::text AS "localDate",
               s.start_time::text AS "startTime", ct.name AS "className"
          FROM reservations r JOIN class_sessions s ON s.id=r.session_id
          JOIN class_types ct ON ct.id=s.class_type_id
         WHERE r.student_id=${id}::uuid ORDER BY s.starts_at DESC LIMIT 40`),
      db.execute(sql16`
        SELECT ct.id, ct.delta, ct.reason::text AS reason, ct.note, ct.created_at AS "createdAt"
          FROM credit_transactions ct WHERE ct.student_id=${id}::uuid ORDER BY ct.created_at DESC LIMIT 40`),
      db.execute(sql16`
        SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
               o.total_clp AS "totalClp", o.paid_at AS "paidAt", o.created_at AS "createdAt"
          FROM orders o WHERE o.student_id=${id}::uuid ORDER BY o.created_at DESC LIMIT 20`)
    ]);
    res.json({
      data: {
        perfil,
        membresias: rowsOf4(membresias),
        reservas: rowsOf4(reservas),
        creditos: rowsOf4(creditos),
        ordenes: rowsOf4(ordenes)
      }
    });
  })
);
adminRouter.post(
  "/students/:id/memberships",
  owner,
  wrap(async (req, res) => {
    const { planSlug, marcarPagado } = z6.object({
      planSlug: z6.string(),
      marcarPagado: z6.boolean().default(true)
    }).parse(req.body);
    const plan = await one(
      sql16`SELECT id, credits, validity_days, price_clp, name FROM plans WHERE slug=${planSlug}`
    );
    if (!plan) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ese plan no existe." } });
    const m = await one(sql16`
      INSERT INTO memberships (student_id, plan_id, status, credits_total, credits_used,
                               starts_on, ends_on, activated_at, price_paid_clp)
      VALUES (${req.params.id}::uuid, ${plan.id}::uuid, 'active', ${plan.credits}, 0,
              (now() AT TIME ZONE 'America/Santiago')::date,
              (now() AT TIME ZONE 'America/Santiago')::date + ${plan.validity_days}::int,
              now(), ${marcarPagado ? plan.price_clp : 0})
      RETURNING id
    `);
    await db.execute(sql16`
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, note, created_by)
      VALUES (${m.id}::uuid, ${req.params.id}::uuid, ${plan.credits}, 'purchase',
              ${"Plan otorgado desde el panel: " + plan.name}, ${req.user.id}::uuid)
    `);
    res.status(201).json({ data: { membershipId: m.id } });
  })
);
adminRouter.post(
  "/memberships/:id/verify",
  owner,
  wrap(async (req, res) => {
    await db.execute(sql16`
      UPDATE memberships SET status='active', verified_by=${req.user.id}::uuid, verified_at=now(),
             activated_at=COALESCE(activated_at, now()), updated_at=now()
       WHERE id=${req.params.id}::uuid AND status='pending_verification'
    `);
    res.json({ data: { ok: true } });
  })
);
adminRouter.post(
  "/memberships/:id/credits",
  owner,
  wrap(async (req, res) => {
    const { delta, note } = z6.object({
      delta: z6.number().int().refine((n) => n !== 0, "El ajuste no puede ser cero"),
      note: z6.string().min(3, "Explica el motivo del ajuste")
    }).parse(req.body);
    const m = await one(
      sql16`SELECT student_id, credits_total, credits_used FROM memberships WHERE id=${req.params.id}::uuid`
    );
    if (!m) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa membres\xEDa no existe." } });
    await db.execute(sql16`
      UPDATE memberships SET credits_total = GREATEST(credits_used, credits_total + ${delta}), updated_at=now()
       WHERE id=${req.params.id}::uuid
    `);
    await db.execute(sql16`
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, note, created_by)
      VALUES (${req.params.id}::uuid, ${m.student_id}::uuid, ${delta}, 'admin_adjust', ${note}, ${req.user.id}::uuid)
    `);
    await db.execute(sql16`
      INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id, summary)
      VALUES (${req.user.id}::uuid, 'owner', 'membership.credits.adjust', 'membership', ${req.params.id}::uuid,
              ${`Ajust\xF3 ${delta > 0 ? "+" : ""}${delta} cr\xE9ditos. Motivo: ${note}`})
    `);
    res.json({ data: { ok: true } });
  })
);
adminRouter.get("/plans", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
    SELECT id, slug, name, segment::text AS segment, period_months AS "periodMonths", credits,
           price_clp AS "priceClp", validity_days AS "validityDays",
           requires_verification AS "requiresVerification", is_drop_in AS "isDropIn",
           allowed_weekdays AS "allowedWeekdays", allowed_time_from::text AS "allowedTimeFrom",
           allowed_time_to::text AS "allowedTimeTo", is_public AS "isPublic", is_active AS "isActive",
           sort_order AS "sortOrder", badge,
           (SELECT count(*)::int FROM memberships m WHERE m.plan_id = plans.id) AS "vendidos"
      FROM plans ORDER BY sort_order, price_clp`));
  res.json({ data: rows });
}));
adminRouter.patch("/plans/:id", owner, wrap(async (req, res) => {
  const input = z6.object({
    name: z6.string().min(2).optional(),
    priceClp: z6.number().int().min(0).optional(),
    credits: z6.number().int().min(1).optional(),
    validityDays: z6.number().int().min(1).optional(),
    isPublic: z6.boolean().optional(),
    isActive: z6.boolean().optional(),
    badge: z6.string().max(40).nullable().optional()
  }).parse(req.body);
  const sets = [];
  if (input.name !== void 0) sets.push(sql16`name = ${input.name}`);
  if (input.priceClp !== void 0) sets.push(sql16`price_clp = ${input.priceClp}`);
  if (input.credits !== void 0) sets.push(sql16`credits = ${input.credits}`);
  if (input.validityDays !== void 0) sets.push(sql16`validity_days = ${input.validityDays}`);
  if (input.isPublic !== void 0) sets.push(sql16`is_public = ${input.isPublic}`);
  if (input.isActive !== void 0) sets.push(sql16`is_active = ${input.isActive}`);
  if (input.badge !== void 0) sets.push(sql16`badge = ${input.badge}`);
  if (!sets.length) return res.json({ data: { ok: true } });
  await db.execute(sql16`UPDATE plans SET ${sql16.join(sets, sql16`, `)} WHERE id = ${req.params.id}::uuid`);
  res.json({ data: { ok: true } });
}));
adminRouter.get("/class-types", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
    SELECT id, slug, name, short_description AS "shortDescription", discipline::text AS discipline,
           default_capacity AS "defaultCapacity", drop_in_price_clp AS "dropInPriceClp",
           color, is_public AS "isPublic", is_active AS "isActive"
      FROM class_types ORDER BY sort_order`));
  res.json({ data: rows });
}));
adminRouter.get("/rooms", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`SELECT id, name, capacity, description, is_active AS "isActive" FROM rooms ORDER BY name`));
  res.json({ data: rows });
}));
adminRouter.get("/instructors", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
    SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email,
           ip.bio, ip.calendar_color AS "calendarColor", ip.is_active AS "isActive",
           (SELECT count(*)::int FROM class_sessions s
             WHERE s.instructor_id=u.id AND s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30) AS "clasesMes"
      FROM users u JOIN instructor_profiles ip ON ip.user_id=u.id ORDER BY u.first_name`));
  res.json({ data: rows });
}));
adminRouter.get("/templates", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
    SELECT t.id, t.weekday, t.start_time::text AS "startTime", t.duration_min AS "durationMin",
           t.capacity, t.is_active AS "isActive", t.effective_from::text AS "effectiveFrom",
           t.materialized_through::text AS "materializedThrough",
           ct.id AS "classTypeId", ct.name AS "className", ct.color,
           rm.id AS "roomId", rm.name AS "roomName",
           i.id AS "instructorId", COALESCE(i.first_name,'Sin asignar') AS "instructorName"
      FROM class_templates t
      JOIN class_types ct ON ct.id=t.class_type_id
      JOIN rooms rm ON rm.id=t.room_id
      LEFT JOIN users i ON i.id=t.instructor_id
     ORDER BY t.weekday, t.start_time`));
  res.json({ data: rows });
}));
adminRouter.post("/templates", owner, wrap(async (req, res) => {
  const input = z6.object({
    classTypeId: z6.string().uuid(),
    roomId: z6.string().uuid(),
    instructorId: z6.string().uuid().nullable().optional(),
    weekday: z6.number().int().min(0).max(6),
    startTime: z6.string().regex(/^\d{2}:\d{2}$/),
    durationMin: z6.number().int().min(15).max(180).default(60),
    capacity: z6.number().int().min(1).max(50)
  }).parse(req.body);
  const t = await one(sql16`
    INSERT INTO class_templates (class_type_id, room_id, instructor_id, weekday, start_time,
                                 duration_min, capacity, effective_from)
    VALUES (${input.classTypeId}::uuid, ${input.roomId}::uuid, ${input.instructorId ?? null}::uuid,
            ${input.weekday}, ${input.startTime}::time, ${input.durationMin}, ${input.capacity},
            (now() AT TIME ZONE 'America/Santiago')::date)
    RETURNING id`);
  const generadas = await materializeSessions();
  res.status(201).json({ data: { templateId: t.id, clasesGeneradas: generadas } });
}));
adminRouter.patch("/templates/:id", owner, wrap(async (req, res) => {
  const input = z6.object({
    capacity: z6.number().int().min(1).max(50).optional(),
    instructorId: z6.string().uuid().nullable().optional(),
    isActive: z6.boolean().optional()
  }).parse(req.body);
  const sets = [];
  if (input.capacity !== void 0) sets.push(sql16`capacity = ${input.capacity}`);
  if (input.instructorId !== void 0) sets.push(sql16`instructor_id = ${input.instructorId}::uuid`);
  if (input.isActive !== void 0) sets.push(sql16`is_active = ${input.isActive}`);
  if (sets.length) {
    await db.execute(sql16`UPDATE class_templates SET ${sql16.join(sets, sql16`, `)}, updated_at=now() WHERE id=${req.params.id}::uuid`);
  }
  res.json({ data: { ok: true } });
}));
adminRouter.post("/materialize", owner, wrap(async (req, res) => {
  const through = z6.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().parse(req.body?.through);
  const creadas = await materializeSessions(through);
  res.json({ data: { clasesGeneradas: creadas } });
}));
adminRouter.get("/orders", owner, wrap(async (req, res) => {
  const estado = req.query.estado || null;
  const rows = rowsOf4(await db.execute(sql16`
    SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
           o.total_clp AS "totalClp", o.paid_at AS "paidAt", o.created_at AS "createdAt", o.provider,
           u.id AS "studentId", u.first_name AS "firstName", u.last_name AS "lastName", u.email,
           (SELECT string_agg(oi.description, ', ') FROM order_items oi WHERE oi.order_id=o.id) AS items
      FROM orders o JOIN users u ON u.id=o.student_id
     WHERE (${estado}::text IS NULL OR o.status::text = ${estado}::text)
     ORDER BY o.created_at DESC LIMIT 200`));
  res.json({ data: rows });
}));
adminRouter.post("/orders/:id/mark-paid", owner, wrap(async (req, res) => {
  const { fulfillOrder: fulfillOrder2 } = await Promise.resolve().then(() => (init_order_service(), order_service_exports));
  await db.execute(sql16`
    UPDATE orders SET status='paid', paid_at=now(), provider='efectivo', updated_at=now()
     WHERE id=${req.params.id}::uuid AND status <> 'paid'`);
  const cumplida = await fulfillOrder2(req.params.id);
  await db.execute(sql16`
    INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id, summary)
    VALUES (${req.user.id}::uuid, 'owner', 'order.mark_paid', 'order', ${req.params.id}::uuid,
            'Marcó la orden como pagada fuera de línea (efectivo o transferencia).')`);
  res.json({ data: { ok: true, membresiaCreada: cumplida } });
}));
adminRouter.get("/reports/occupancy", owner, wrap(async (_req, res) => {
  const porHorario = rowsOf4(await db.execute(sql16`
    SELECT s.start_time::text AS hora, EXTRACT(DOW FROM s.local_date)::int AS dia,
           COALESCE(sum(s.booked_count),0)::int AS reservas,
           COALESCE(sum(s.capacity),0)::int AS cupos,
           CASE WHEN sum(s.capacity) > 0 THEN round(100.0*sum(s.booked_count)/sum(s.capacity))::int ELSE 0 END AS ocupacion
      FROM class_sessions s
     WHERE s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 60
       AND s.local_date < (now() AT TIME ZONE 'America/Santiago')::date
     GROUP BY 1,2 ORDER BY 2,1`));
  res.json({ data: { porHorario } });
}));
adminRouter.get("/reports/revenue", owner, wrap(async (_req, res) => {
  const porPlan = rowsOf4(await db.execute(sql16`
    SELECT p.name AS plan, p.segment::text AS segmento, count(*)::int AS ventas,
           sum(o.total_clp)::int AS total
      FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN plans p ON p.id=oi.plan_id
     WHERE o.status='paid' GROUP BY p.name, p.segment ORDER BY total DESC`));
  const porMes = rowsOf4(await db.execute(sql16`
    SELECT to_char(date_trunc('month', paid_at AT TIME ZONE 'America/Santiago'),'YYYY-MM') AS mes,
           sum(total_clp)::int AS total, count(*)::int AS ordenes
      FROM orders WHERE status='paid' GROUP BY 1 ORDER BY 1`));
  res.json({ data: { porPlan, porMes } });
}));
adminRouter.get("/reports/retention", owner, wrap(async (_req, res) => {
  const enRiesgo = rowsOf4(await db.execute(sql16`
    SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
           max(s.starts_at) AS "ultimaVisita",
           (now()::date - max(s.starts_at)::date)::int AS "diasSinVenir"
      FROM users u
      JOIN reservations r ON r.student_id=u.id AND r.status='attended'
      JOIN class_sessions s ON s.id=r.session_id
     WHERE u.role='student'
     GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
    HAVING (now()::date - max(s.starts_at)::date) BETWEEN 14 AND 90
     ORDER BY "diasSinVenir" DESC LIMIT 40`));
  res.json({ data: { enRiesgo } });
}));
adminRouter.get("/email-templates", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
    SELECT id, key, name, subject, html_body AS "htmlBody", sample_vars AS "sampleVars",
           is_active AS "isActive", updated_at AS "updatedAt" FROM email_templates ORDER BY key`));
  res.json({ data: rows });
}));
adminRouter.patch("/email-templates/:key", owner, wrap(async (req, res) => {
  const input = z6.object({ subject: z6.string().min(3).optional(), htmlBody: z6.string().min(10).optional() }).parse(req.body);
  const sets = [];
  if (input.subject) sets.push(sql16`subject = ${input.subject}`);
  if (input.htmlBody) sets.push(sql16`html_body = ${input.htmlBody}`);
  if (sets.length) {
    await db.execute(sql16`
      UPDATE email_templates SET ${sql16.join(sets, sql16`, `)}, updated_by=${req.user.id}::uuid, updated_at=now()
       WHERE key=${req.params.key}`);
  }
  res.json({ data: { ok: true } });
}));
var audienceSchema = z6.object({
  membership: z6.enum(["todas", "active", "expiring", "expired", "none"]).default("todas"),
  inactiveDays: z6.number().int().min(0).max(365).optional(),
  marketingOptIn: z6.boolean().default(true)
});
async function audienceQuery(filter) {
  return sql16`
    SELECT u.id, u.email, u.first_name AS "firstName", u.last_name AS "lastName"
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id=u.id
      LEFT JOIN LATERAL (
        SELECT mm.status::text AS status,
               (mm.ends_on - (now() AT TIME ZONE 'America/Santiago')::date)::int AS days_left
          FROM memberships mm WHERE mm.student_id=u.id AND mm.status IN ('active','pending_verification')
         ORDER BY mm.ends_on DESC LIMIT 1) m ON true
     WHERE u.role='student' AND u.status='active'
       AND (${filter.marketingOptIn} = false OR COALESCE(sp.marketing_opt_in, true) = true)
       AND (${filter.membership} = 'todas'
            OR (${filter.membership} = 'active'   AND m.status = 'active')
            OR (${filter.membership} = 'expiring' AND m.status = 'active' AND m.days_left <= 7)
            OR (${filter.membership} = 'expired'  AND m.status IS NULL
                AND EXISTS (SELECT 1 FROM memberships x WHERE x.student_id=u.id))
            OR (${filter.membership} = 'none'     AND m.status IS NULL))
       AND (${filter.inactiveDays ?? null}::int IS NULL OR NOT EXISTS (
             SELECT 1 FROM reservations r JOIN class_sessions s ON s.id=r.session_id
              WHERE r.student_id=u.id AND r.status='attended'
                AND s.starts_at > now() - (${filter.inactiveDays ?? 0}::int || ' days')::interval))
     ORDER BY u.first_name`;
}
adminRouter.post("/campaigns/preview-audience", owner, wrap(async (req, res) => {
  const filter = audienceSchema.parse(req.body ?? {});
  const rows = rowsOf4(await db.execute(await audienceQuery(filter)));
  res.json({ data: { total: rows.length, muestra: rows.slice(0, 8) } });
}));
adminRouter.get("/campaigns", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
    SELECT id, name, subject, status::text AS status, recipients_count AS "recipientsCount",
           sent_at AS "sentAt", created_at AS "createdAt", audience_filter AS "audienceFilter"
      FROM email_campaigns ORDER BY created_at DESC`));
  res.json({ data: rows });
}));
adminRouter.post("/campaigns", owner, wrap(async (req, res) => {
  const input = z6.object({
    name: z6.string().min(3),
    subject: z6.string().min(3),
    htmlBody: z6.string().min(10),
    audience: audienceSchema.default({ membership: "todas", marketingOptIn: true }),
    enviar: z6.boolean().default(false)
  }).parse(req.body);
  const destinatarias = rowsOf4(
    await db.execute(await audienceQuery(input.audience))
  );
  const c = await one(sql16`
    INSERT INTO email_campaigns (name, subject, html_body, audience_filter, status, recipients_count, created_by, sent_at)
    VALUES (${input.name}, ${input.subject}, ${input.htmlBody}, ${JSON.stringify(input.audience)}::jsonb,
            ${input.enviar ? "sent" : "draft"}::campaign_status, ${destinatarias.length},
            ${req.user.id}::uuid, ${input.enviar ? sql16`now()` : sql16`NULL`})
    RETURNING id`);
  if (input.enviar) {
    for (const d of destinatarias) {
      await db.execute(sql16`
        INSERT INTO email_outbox (to_email, to_user_id, subject, html_body, campaign_id, dedupe_key)
        VALUES (${d.email}, ${d.id}::uuid, ${input.subject},
                ${input.htmlBody.replace(/\{\{\s*nombre\s*\}\}/g, d.firstName)},
                ${c.id}::uuid, ${`campaign:${c.id}:${d.id}`})
        ON CONFLICT (dedupe_key) DO NOTHING`);
    }
  }
  res.status(201).json({ data: { campaignId: c.id, destinatarias: destinatarias.length, enviada: input.enviar } });
}));
adminRouter.get("/outbox", owner, wrap(async (req, res) => {
  const estado = req.query.estado || null;
  const rows = rowsOf4(await db.execute(sql16`
    SELECT id, to_email AS "toEmail", subject, status::text AS status, template_key AS "templateKey",
           campaign_id AS "campaignId", attempts, last_error AS "lastError",
           created_at AS "createdAt", sent_at AS "sentAt"
      FROM email_outbox
     WHERE (${estado}::text IS NULL OR status::text = ${estado}::text)
     ORDER BY id DESC LIMIT 200`));
  const resumen = await one(sql16`
    SELECT count(*) FILTER (WHERE status='queued')::int AS "enCola",
           count(*) FILTER (WHERE status='sent')::int AS enviados,
           count(*) FILTER (WHERE status='failed')::int AS fallidos
      FROM email_outbox`);
  res.json({ data: { correos: rows, resumen } });
}));
adminRouter.get("/settings", owner, wrap(async (_req, res) => {
  const { getSettings: getSettings2 } = await Promise.resolve().then(() => (init_settings_service(), settings_service_exports));
  res.json({ data: await getSettings2() });
}));
adminRouter.patch("/settings", owner, wrap(async (req, res) => {
  const entries = Object.entries(req.body ?? {});
  for (const [key, value] of entries) {
    await db.execute(sql16`
      INSERT INTO settings (key, value, updated_by) VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${req.user.id}::uuid)
      ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now()`);
  }
  res.json({ data: { actualizadas: entries.length } });
}));
adminRouter.get("/audit", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
    SELECT a.id, a.action, a.entity_type AS "entityType", a.summary, a.created_at AS "createdAt",
           COALESCE(u.first_name || ' ' || u.last_name, 'Sistema') AS actor
      FROM audit_log a LEFT JOIN users u ON u.id=a.actor_user_id
     ORDER BY a.created_at DESC LIMIT 100`));
  res.json({ data: rows });
}));
adminRouter.get("/leads", owner, wrap(async (_req, res) => {
  const rows = rowsOf4(await db.execute(sql16`
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
        sql17`SELECT now() AS now, (now() AT TIME ZONE 'America/Santiago')::date AS today`
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
  app2.use("/api", studentRouter);
  app2.use("/api", paymentsRouter);
  app2.use("/api/webhooks", webhooksRouter);
  app2.use("/api/admin", adminRouter);
}

// server/app.ts
function buildApp() {
  const app2 = express();
  app2.set("trust proxy", true);
  app2.use("/api/webhooks", express.raw({ type: "*/*", limit: "1mb" }));
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
