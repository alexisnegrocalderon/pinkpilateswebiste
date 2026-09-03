import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { DomainError } from "@shared/domain/errors";

type PgError = { code?: string; constraint?: string };

/** Baja por la cadena de `cause` hasta encontrar el error real de Postgres. */
function unwrapPg(err: unknown): PgError {
  let current = err as { code?: string; constraint?: string; cause?: unknown } | undefined;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current.code === "string") return current;
    current = current.cause as typeof current;
  }
  return {};
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado." } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DomainError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION",
        message: "Los datos enviados no son válidos.",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }

  // Violaciones de constraint de Postgres que representan reglas de negocio.
  // Drizzle envuelve el error original, asi que hay que bajar por `cause`:
  // sin esto todo constraint violado se reporta como error interno generico.
  const pg = unwrapPg(err);
  if (pg?.code === "23505") {
    if (pg.constraint === "uq_reservation_active") {
      return res.status(409).json({
        error: { code: "ALREADY_BOOKED", message: "Ya tienes una reserva en esta clase." },
      });
    }
    return res.status(409).json({
      error: { code: "CONFLICT", message: "Ese registro ya existe." },
    });
  }
  if (pg?.code === "23514" && pg.constraint === "ck_session_booked_within_capacity") {
    return res.status(409).json({
      error: { code: "SESSION_FULL", message: "La clase acaba de llenarse." },
    });
  }
  if (pg?.code === "23P01") {
    return res.status(409).json({
      error: { code: "CONFLICT", message: "Ya hay otra clase en esa sala a esa hora." },
    });
  }

  console.error("[error]", err);
  return res.status(500).json({
    error: { code: "INTERNAL", message: "Ocurrió un error inesperado." },
  });
}

/** Envuelve handlers async para que sus rechazos lleguen al errorHandler. */
export const wrap =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
