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
  uuid,
} from "drizzle-orm/pg-core";
import { citext } from "./_types";
import { discipline, userRole, userStatus } from "./enums";

export const users = pgTable(
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
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("uq_users_email").on(t.email),
    uniqueIndex("uq_users_rut").on(t.rut).where(sql`${t.rut} IS NOT NULL`),
    index("idx_users_role_status").on(t.role, t.status),
  ],
);

export const studentProfiles = pgTable("student_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
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
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const instructorProfiles = pgTable("instructor_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  specialties: discipline("specialties").array(),
  /** Color hex para distinguirla en la grilla de la agenda. */
  calendarColor: text("calendar_color"),
  isActive: boolean("is_active").notNull().default(true),
  certifications: text("certifications"),
});

export const authSessions = pgTable(
  "auth_sessions",
  {
    /** El valor de la cookie: 32 bytes aleatorios en base64url. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ip: inet("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("idx_auth_sessions_user").on(t.userId), index("idx_auth_sessions_expires").on(t.expiresAt)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  /** sha256 del token que viaja por email; el token plano nunca se guarda. */
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  instructorProfile: one(instructorProfiles, {
    fields: [users.id],
    references: [instructorProfiles.userId],
  }),
}));
