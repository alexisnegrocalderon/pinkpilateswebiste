import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "instructor", "student"]);
export const userStatus = pgEnum("user_status", ["active", "inactive", "invited"]);

export const discipline = pgEnum("discipline", [
  "apparatus",
  "mat",
  "barre",
  "dance",
  "prenatal",
  "senior",
  "bridal",
  "teacher_training",
]);
export const classLevel = pgEnum("class_level", ["intro", "all_levels", "intermediate", "advanced"]);

export const sessionStatus = pgEnum("session_status", ["scheduled", "cancelled", "completed"]);

export const reservationStatus = pgEnum("reservation_status", [
  "booked",
  "attended",
  "no_show",
  "cancelled",
  "late_cancelled",
  "studio_cancelled",
]);
export const reservationSource = pgEnum("reservation_source", ["web", "admin", "waitlist"]);
export const waitlistStatus = pgEnum("waitlist_status", [
  "waiting",
  "offered",
  "promoted",
  "expired",
  "cancelled",
]);

/** Segmento comercial. Refleja la matriz real de pinkpilates.cl. */
export const planSegment = pgEnum("plan_segment", ["adult", "student", "valle", "special"]);

export const membershipStatus = pgEnum("membership_status", [
  "pending_verification",
  "active",
  "expired",
  "depleted",
  "cancelled",
]);

export const creditReason = pgEnum("credit_reason", [
  "purchase",
  "booking",
  "cancellation_refund",
  "late_cancel_forfeit",
  "no_show_forfeit",
  "studio_cancel_refund",
  "admin_adjust",
  "expiration",
]);

export const orderStatus = pgEnum("order_status", [
  "draft",
  "awaiting_payment",
  "paid",
  "failed",
  "expired",
  "cancelled",
  "refunded",
]);
export const orderItemKind = pgEnum("order_item_kind", ["plan", "drop_in"]);
export const paymentStatus = pgEnum("payment_status", [
  "created",
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "expired",
]);

export const couponType = pgEnum("coupon_type", ["percent", "fixed"]);

export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "cancelled",
]);
export const outboxStatus = pgEnum("outbox_status", ["queued", "sending", "sent", "failed", "skipped"]);

export const leadStatus = pgEnum("lead_status", ["new", "contacted", "converted", "discarded"]);
