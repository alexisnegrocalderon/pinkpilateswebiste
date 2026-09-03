import { and, eq, gt, isNull } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { authSessions, users } from "@shared/schema";
import { db } from "../db/client";
import { isProd } from "../env";

export const SESSION_COOKIE = "pp_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  role: "owner" | "instructor" | "student";
  firstName: string;
  lastName: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionId?: string;
    }
  }
}

/**
 * Serializacion a mano en vez de depender del paquete `cookie`, cuya API
 * cambio entre versiones mayores. Son dos lineas y no vuelven a romperse.
 */
function serializeCookie(value: string, maxAgeSeconds: number) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd()) parts.push("Secure");
  return parts.join("; ");
}

function readCookie(header: string, name: string): string | undefined {
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

export function setSessionCookie(res: Response, sessionId: string) {
  res.setHeader("Set-Cookie", serializeCookie(sessionId, THIRTY_DAYS_MS / 1000));
}

export function clearSessionCookie(res: Response) {
  res.setHeader("Set-Cookie", serializeCookie("", 0));
}

export const sessionExpiry = () => new Date(Date.now() + THIRTY_DAYS_MS);

/**
 * Resuelve la sesión en cada request. No falla si no hay sesión: sólo deja
 * `req.user` vacío para que las rutas públicas sigan funcionando.
 */
export async function loadSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.cookie;
    if (!header) return next();
    const sid = readCookie(header, SESSION_COOKIE);
    if (!sid) return next();

    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        status: users.status,
      })
      .from(authSessions)
      .innerJoin(users, eq(users.id, authSessions.userId))
      .where(
        and(
          eq(authSessions.id, sid),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (row && row.status === "active") {
      req.user = {
        id: row.id,
        email: row.email,
        role: row.role,
        firstName: row.firstName,
        lastName: row.lastName,
      };
      req.sessionId = sid;
    }
    next();
  } catch (err) {
    next(err);
  }
}
