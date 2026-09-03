import { eq } from "drizzle-orm";
import { emailOutbox, emailTemplates } from "@shared/schema";
import { STUDIO } from "@shared/domain/policy";
import { db } from "../db/client";

export type TemplateKey =
  | "welcome"
  | "booking_confirmed"
  | "booking_cancelled"
  | "class_cancelled_by_studio"
  | "waitlist_promoted"
  | "class_reminder_24h"
  | "payment_receipt"
  | "membership_expiring"
  | "credits_low"
  | "password_reset";

/** Reemplazo de {{variable}}. Sin motor de plantillas: no hace falta. */
export function render(body: string, vars: Record<string, unknown>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => {
    const value = vars[key] ?? (STUDIO as Record<string, unknown>)[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

/**
 * Encola un email. NUNCA envía dentro de la transacción de negocio: si el
 * proveedor SMTP está caído, una reserva no debe deshacerse por eso.
 *
 * `dedupeKey` evita duplicados cuando un job se ejecuta dos veces.
 */
export async function queue(params: {
  toEmail: string;
  toUserId?: string | null;
  subject: string;
  htmlBody: string;
  textBody?: string;
  templateKey?: string;
  campaignId?: string;
  dedupeKey?: string;
  scheduledFor?: Date;
}) {
  try {
    await db
      .insert(emailOutbox)
      .values({
        toEmail: params.toEmail,
        toUserId: params.toUserId ?? null,
        subject: params.subject,
        htmlBody: params.htmlBody,
        textBody: params.textBody ?? null,
        templateKey: params.templateKey ?? null,
        campaignId: params.campaignId ?? null,
        dedupeKey: params.dedupeKey ?? null,
        scheduledFor: params.scheduledFor ?? new Date(),
      })
      .onConflictDoNothing();
  } catch (err) {
    // Un fallo al encolar jamás debe tumbar la operación de negocio que lo pidió.
    console.error("[email] no se pudo encolar", err);
  }
}

export async function queueTemplate(
  key: TemplateKey,
  toUserId: string | null,
  toEmail: string,
  vars: Record<string, unknown>,
  opts: { dedupeKey?: string; scheduledFor?: Date } = {},
) {
  const [tpl] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, key)).limit(1);
  if (!tpl || !tpl.isActive) return;

  await queue({
    toEmail,
    toUserId,
    subject: render(tpl.subject, vars),
    htmlBody: render(tpl.htmlBody, vars),
    textBody: tpl.textBody ? render(tpl.textBody, vars) : undefined,
    templateKey: key,
    dedupeKey: opts.dedupeKey,
    scheduledFor: opts.scheduledFor,
  });
}
