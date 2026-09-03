import { sql } from "drizzle-orm";
import { db } from "../db/client";
import type { WebhookEvent } from "../payments/types";
import { fulfillOrder } from "./order.service";

const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];

/**
 * Aplica un evento de webhook. Es idéntica para toda pasarela: el adaptador ya
 * tradujo el formato del proveedor a WebhookEvent.
 *
 * La idempotencia la garantiza el índice único (provider, event_id) de
 * payment_events: si el proveedor reintenta, el INSERT no inserta y salimos.
 */
export async function applyWebhookEvent(provider: string, event: WebhookEvent) {
  const inserted = rowsOf<{ id: number }>(
    await db.execute(sql`
      INSERT INTO payment_events (provider, event_id, event_type, signature_valid, payload)
      VALUES (${provider}, ${event.eventId}, ${event.type}, ${event.signatureValid},
              ${JSON.stringify(event.raw)}::jsonb)
      ON CONFLICT (provider, event_id) DO NOTHING
      RETURNING id
    `),
  );
  if (!inserted.length) return { duplicated: true, applied: false };

  const statusMap: Record<WebhookEvent["type"], string> = {
    "payment.pending": "pending",
    "payment.paid": "paid",
    "payment.failed": "failed",
    "payment.expired": "expired",
    "payment.refunded": "refunded",
  };
  const newStatus = statusMap[event.type];

  await db.execute(sql`
    UPDATE payments
       SET status = ${newStatus}::payment_status,
           paid_at = CASE WHEN ${newStatus} = 'paid' THEN now() ELSE paid_at END,
           updated_at = now()
     WHERE provider = ${provider} AND provider_payment_id = ${event.providerPaymentId}
  `);

  const [payment] = rowsOf<{ order_id: string }>(
    await db.execute(sql`
      SELECT order_id FROM payments WHERE provider = ${provider} AND provider_payment_id = ${event.providerPaymentId}
    `),
  );
  const orderId = payment?.order_id ?? event.orderId;
  if (!orderId) return { duplicated: false, applied: false };

  if (newStatus === "paid") {
    await db.execute(sql`
      UPDATE orders SET status = 'paid', paid_at = now(), updated_at = now()
       WHERE id = ${orderId}::uuid AND status <> 'paid'
    `);
    await fulfillOrder(orderId);
  } else if (newStatus === "failed" || newStatus === "expired") {
    await db.execute(sql`
      UPDATE orders SET status = ${newStatus === "failed" ? "failed" : "expired"}::order_status, updated_at = now()
       WHERE id = ${orderId}::uuid AND status = 'awaiting_payment'
    `);
    // Se libera el cupo que estaba en hold por esta orden.
    await db.execute(sql`
      WITH freed AS (
        UPDATE reservations SET status = 'cancelled', cancelled_at = now()
         WHERE order_id = ${orderId}::uuid AND status = 'booked' AND membership_id IS NULL
        RETURNING session_id
      )
      UPDATE class_sessions s SET booked_count = GREATEST(0, s.booked_count - 1)
        FROM freed WHERE s.id = freed.session_id
    `);
  }

  await db.execute(sql`
    UPDATE payment_events SET processed_at = now() WHERE id = ${inserted[0].id}
  `);

  return { duplicated: false, applied: true, orderId, status: newStatus };
}

export async function createPaymentRecord(params: {
  orderId: string; provider: string; providerPaymentId: string; amountClp: number; redirectUrl: string;
}) {
  await db.execute(sql`
    INSERT INTO payments (order_id, provider, provider_payment_id, status, amount_clp, redirect_url)
    VALUES (${params.orderId}::uuid, ${params.provider}, ${params.providerPaymentId}, 'pending',
            ${params.amountClp}, ${params.redirectUrl})
  `);
  await db.execute(sql`
    UPDATE orders SET provider = ${params.provider}, updated_at = now() WHERE id = ${params.orderId}::uuid
  `);
}
