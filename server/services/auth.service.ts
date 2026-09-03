import { and, eq, isNull, sql } from "drizzle-orm";
import { fail } from "@shared/domain/errors";
import { authSessions, passwordResetTokens, studentProfiles, users } from "@shared/schema";
import type { RegisterInput } from "@shared/dto/auth.dto";
import { db } from "../db/client";
import { hashPassword, verifyPassword } from "../lib/password";
import { randomToken, sha256 } from "../lib/tokens";
import { sessionExpiry } from "../middleware/session";

export async function register(input: RegisterInput, ip?: string, userAgent?: string) {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing.length) {
    fail("CONFLICT", "Ya existe una cuenta con ese email. Inicia sesión o recupera tu contraseña.");
  }

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: "student",
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    })
    .returning();

  await db.insert(studentProfiles).values({
    userId: user.id,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    healthNotes: input.healthNotes,
    marketingOptIn: input.marketingOptIn,
  });

  const sessionId = await createSession(user.id, ip, userAgent);
  return { user, sessionId };
}

export async function login(email: string, password: string, ip?: string, userAgent?: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Mismo mensaje para email inexistente y clave incorrecta: no revelamos qué
  // emails están registrados.
  const generic = "Email o contraseña incorrectos.";
  if (!user || !user.passwordHash) fail("UNAUTHENTICATED", generic);
  if (user.status !== "active") fail("FORBIDDEN", "Tu cuenta está desactivada. Escríbenos para reactivarla.");

  const ok = await verifyPassword(password, user.passwordHash!);
  if (!ok) {
    await db
      .update(users)
      .set({ failedLoginCount: sql`${users.failedLoginCount} + 1` })
      .where(eq(users.id, user.id));
    fail("UNAUTHENTICATED", generic);
  }

  await db
    .update(users)
    .set({ failedLoginCount: 0, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const sessionId = await createSession(user.id, ip, userAgent);
  return { user, sessionId };
}

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  const id = randomToken(32);
  await db.insert(authSessions).values({
    id,
    userId,
    expiresAt: sessionExpiry(),
    ip: ip ?? null,
    userAgent: userAgent?.slice(0, 500) ?? null,
  });
  return id;
}

export async function revokeSession(sessionId: string) {
  await db.update(authSessions).set({ revokedAt: new Date() }).where(eq(authSessions.id, sessionId));
}

export async function revokeAllSessions(userId: string) {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
}

export async function changePassword(userId: string, current: string, next: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.passwordHash) fail("NOT_FOUND", "Usuario no encontrado.");
  if (!(await verifyPassword(current, user.passwordHash!))) {
    fail("VALIDATION", "La contraseña actual no es correcta.");
  }
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, userId));
  await revokeAllSessions(userId);
}

/** Devuelve el token en claro; sólo su hash queda almacenado. */
export async function createPasswordResetToken(email: string) {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;

  const token = randomToken(32);
  await db.insert(passwordResetTokens).values({
    tokenHash: sha256(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  return { token, userId: user.id };
}

export async function resetPassword(token: string, newPassword: string) {
  const hash = sha256(token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, hash), isNull(passwordResetTokens.usedAt)))
    .limit(1);

  if (!row || row.expiresAt < new Date()) {
    fail("VALIDATION", "El enlace de recuperación venció o ya fue usado. Pide uno nuevo.");
  }

  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, row.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.tokenHash, hash));
  await revokeAllSessions(row.userId);
}
