import { randomUUID } from "crypto";
import { env } from "../env";
import { hmac, safeEqual, signPayload, verifyPayload } from "../lib/tokens";
import type {
  CheckoutRequest, CheckoutSession, PaymentProvider, PaymentSnapshot,
  RefundRequest, RefundResult, WebhookEvent, WebhookRequest,
} from "./types";

/**
 * Pasarela simulada.
 *
 * No es un atajo que salta pasos: recorre el flujo completo de una pasarela
 * real —redirección a un pagador externo, webhook firmado con HMAC de vuelta,
 * verificación de firma e idempotencia por event_id— para que el día que entre
 * Mercado Pago o Flow, lo único que cambie sea este archivo.
 */
export class MockProvider implements PaymentProvider {
  readonly id = "mock" as const;
  readonly displayName = "Pasarela de prueba";

  async createCheckout(req: CheckoutRequest): Promise<CheckoutSession> {
    const providerPaymentId = `mock_${randomUUID()}`;
    const token = signPayload(
      env().MOCK_WEBHOOK_SECRET,
      { orderId: req.orderId, providerPaymentId, amountClp: req.amountClp, orderNumber: req.orderNumber },
      30 * 60,
    );

    return {
      providerPaymentId,
      redirectUrl: `/pagar/mock/${encodeURIComponent(token)}`,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60_000),
      raw: { simulated: true, orderNumber: req.orderNumber },
    };
  }

  /** Verifica la firma de verdad: si no calza, la ruta responde 401. */
  async parseWebhook(req: WebhookRequest): Promise<WebhookEvent> {
    const signature = String(req.headers["x-mock-signature"] ?? "");
    const body = req.rawBody.toString("utf8");
    const expected = hmac(env().MOCK_WEBHOOK_SECRET, body);
    const signatureValid = Boolean(signature) && safeEqual(signature, expected);

    const payload = JSON.parse(body) as {
      event_id: string; type: WebhookEvent["type"];
      payment_id: string; order_id: string; amount: number; ts: string;
    };

    return {
      eventId: payload.event_id,
      type: payload.type,
      providerPaymentId: payload.payment_id,
      orderId: payload.order_id,
      amountClp: payload.amount,
      occurredAt: new Date(payload.ts),
      signatureValid,
      raw: payload,
    };
  }

  async getPayment(providerPaymentId: string): Promise<PaymentSnapshot> {
    return { providerPaymentId, status: "pending", amountClp: 0, raw: {} };
  }

  async refund(req: RefundRequest): Promise<RefundResult> {
    return { providerRefundId: `mockref_${randomUUID()}`, status: "done", raw: { ...req } };
  }

  /** Sólo del mock: valida el token del pagador simulado. */
  readToken(token: string) {
    return verifyPayload<{ orderId: string; providerPaymentId: string; amountClp: number; orderNumber: string }>(
      env().MOCK_WEBHOOK_SECRET,
      token,
    );
  }
}
