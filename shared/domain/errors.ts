/** Códigos de dominio que el front traduce a mensajes accionables. */
export type DomainCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "SESSION_FULL"
  | "SESSION_CLOSED"
  | "SESSION_CANCELLED"
  | "ALREADY_BOOKED"
  | "NO_ACTIVE_PLAN"
  | "PLAN_NOT_APPLICABLE"
  | "PLAN_TIME_RESTRICTED"
  | "NO_CREDITS"
  | "DAILY_LIMIT"
  | "LATE_CANCEL"
  | "TOO_LATE_TO_CANCEL"
  | "NOT_ON_WAITLIST"
  | "COUPON_INVALID"
  | "ORDER_EXPIRED"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

const STATUS: Record<DomainCode, number> = {
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
  INTERNAL: 500,
};

export class DomainError extends Error {
  readonly code: DomainCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: DomainCode, message: string, details?: unknown) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
}

export const fail = (code: DomainCode, message: string, details?: unknown): never => {
  throw new DomainError(code, message, details);
};
