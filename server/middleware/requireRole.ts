import type { NextFunction, Request, Response } from "express";
import { DomainError } from "@shared/domain/errors";

type Role = "owner" | "instructor" | "student";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new DomainError("UNAUTHENTICATED", "Necesitas iniciar sesión."));
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new DomainError("UNAUTHENTICATED", "Necesitas iniciar sesión."));
    // La dueña puede hacer todo lo que puede hacer cualquier otro rol.
    if (req.user.role === "owner" || roles.includes(req.user.role)) return next();
    return next(new DomainError("FORBIDDEN", "No tienes permiso para hacer esto."));
  };
}
