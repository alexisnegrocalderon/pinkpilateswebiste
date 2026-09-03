import { Router } from "express";
import { eq } from "drizzle-orm";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@shared/dto/auth.dto";
import { studentProfiles, users } from "@shared/schema";
import { db } from "../db/client";
import { wrap } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/requireRole";
import { clearSessionCookie, setSessionCookie } from "../middleware/session";
import * as auth from "../services/auth.service";
import { queueTemplate } from "../services/email.service";

export const authRouter = Router();

const publicUser = (u: { id: string; email: string; role: string; firstName: string; lastName: string }) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName,
});

authRouter.post(
  "/register",
  wrap(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const { user, sessionId } = await auth.register(input, req.ip, req.headers["user-agent"]);
    setSessionCookie(res, sessionId);
    await queueTemplate("welcome", user.id, user.email, { nombre: user.firstName });
    res.status(201).json({ data: publicUser(user) });
  }),
);

authRouter.post(
  "/login",
  wrap(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { user, sessionId } = await auth.login(email, password, req.ip, req.headers["user-agent"]);
    setSessionCookie(res, sessionId);
    res.json({ data: publicUser(user) });
  }),
);

authRouter.post(
  "/logout",
  wrap(async (req, res) => {
    if (req.sessionId) await auth.revokeSession(req.sessionId);
    clearSessionCookie(res);
    res.json({ data: { ok: true } });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    const [row] = await db
      .select()
      .from(users)
      .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(users.id, req.user!.id))
      .limit(1);

    res.json({
      data: {
        ...publicUser(row.users),
        phone: row.users.phone,
        birthDate: row.users.birthDate,
        profile: row.student_profiles ?? null,
      },
    });
  }),
);

authRouter.patch(
  "/me",
  requireAuth,
  wrap(async (req, res) => {
    const input = updateProfileSchema.parse(req.body);
    const userId = req.user!.id;

    const userFields = {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.birthDate !== undefined && { birthDate: input.birthDate }),
    };
    if (Object.keys(userFields).length) {
      await db.update(users).set({ ...userFields, updatedAt: new Date() }).where(eq(users.id, userId));
    }

    const profileFields = {
      ...(input.emergencyContactName !== undefined && { emergencyContactName: input.emergencyContactName }),
      ...(input.emergencyContactPhone !== undefined && { emergencyContactPhone: input.emergencyContactPhone }),
      ...(input.healthNotes !== undefined && { healthNotes: input.healthNotes }),
      ...(input.goals !== undefined && { goals: input.goals }),
      ...(input.marketingOptIn !== undefined && { marketingOptIn: input.marketingOptIn }),
    };
    if (Object.keys(profileFields).length) {
      await db.update(studentProfiles).set(profileFields).where(eq(studentProfiles.userId, userId));
    }

    res.json({ data: { ok: true } });
  }),
);

authRouter.post(
  "/password/change",
  requireAuth,
  wrap(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await auth.changePassword(req.user!.id, currentPassword, newPassword);
    clearSessionCookie(res);
    res.json({ data: { ok: true } });
  }),
);

authRouter.post(
  "/password/forgot",
  wrap(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await auth.createPasswordResetToken(email);
    if (result) {
      await queueTemplate("password_reset", result.userId, email, { token: result.token });
    }
    // Se responde igual exista o no la cuenta: no filtramos qué emails existen.
    res.json({ data: { ok: true } });
  }),
);

authRouter.post(
  "/password/reset",
  wrap(async (req, res) => {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await auth.resetPassword(token, newPassword);
    res.json({ data: { ok: true } });
  }),
);
