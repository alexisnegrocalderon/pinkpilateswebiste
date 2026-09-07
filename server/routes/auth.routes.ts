import { Router } from "express";
import { eq } from "drizzle-orm";
import { changePasswordSchema, loginSchema } from "@shared/dto/auth.dto";
import { users } from "@shared/schema";
import { db } from "../db/client";
import { wrap } from "../middleware/errorHandler";
import { strictAuthRateLimit } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/requireRole";
import { clearSessionCookie, setSessionCookie } from "../middleware/session";
import * as auth from "../services/auth.service";

export const authRouter = Router();

const publicUser = (u: { id: string; email: string; role: string; firstName: string; lastName: string }) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName,
});

authRouter.post(
  "/login",
  strictAuthRateLimit,
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
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    res.json({ data: publicUser(user) });
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
