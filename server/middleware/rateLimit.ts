import rateLimit from "express-rate-limit";
import { DomainError } from "@shared/domain/errors";

/**
 * express-rate-limit lleva la cuenta en memoria del proceso. En Vercel cada
 * lambda es un proceso nuevo, así que esto NO es un límite global — es una
 * red mínima contra fuerza bruta desde una misma conexión reutilizada
 * (la mayoría de los intentos automatizados sí la reutilizan). No reemplaza
 * un límite compartido (ej. Redis) si el volumen de abuso lo justifica algún
 * día; hoy es infinitamente mejor que no tener nada.
 */
const respondRateLimited = (_req: unknown, res: import("express").Response) => {
  const err = new DomainError("RATE_LIMITED", "Demasiados intentos. Espera un minuto e inténtalo de nuevo.");
  res.status(err.status).json({ error: { code: err.code, message: err.message } });
};

export const authRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respondRateLimited,
});

/** Más estricto: intentar contraseñas o abrir tokens de recuperación en volumen. */
export const strictAuthRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respondRateLimited,
});

/** Crear órdenes de compra es público (sin login) — freno contra spam de órdenes. */
export const checkoutRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: respondRateLimited,
});
