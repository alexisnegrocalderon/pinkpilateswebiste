export type Clp = number;

export type PaymentStatusValue =
  | "created" | "pending" | "authorized" | "paid" | "failed" | "refunded" | "expired";

export interface CheckoutRequest {
  orderId: string;
  orderNumber: string;
  amountClp: Clp;
  description: string;
  customer: { id: string; email: string; name: string };
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  providerPaymentId: string;
  redirectUrl: string;
  status: PaymentStatusValue;
  expiresAt?: Date;
  raw: unknown;
}

export interface PaymentSnapshot {
  providerPaymentId: string;
  status: PaymentStatusValue;
  amountClp: Clp;
  paidAt?: Date;
  paymentMethod?: string;
  failureReason?: string;
  raw: unknown;
}

export interface WebhookRequest {
  headers: Record<string, string | string[] | undefined>;
  rawBody: Buffer;
  query: Record<string, string | undefined>;
}

export interface WebhookEvent {
  eventId: string;
  type: "payment.pending" | "payment.paid" | "payment.failed" | "payment.expired" | "payment.refunded";
  providerPaymentId: string;
  orderId?: string;
  amountClp?: Clp;
  occurredAt: Date;
  signatureValid: boolean;
  raw: unknown;
}

export interface RefundRequest { providerPaymentId: string; amountClp: Clp; reason?: string }
export interface RefundResult { providerRefundId: string; status: "pending" | "done" | "failed"; raw: unknown }

/**
 * Contrato agnóstico de pasarela. La pasarela definitiva (Mercado Pago, Flow o
 * Transbank) se decide con la dueña; migrar significa escribir un archivo que
 * implemente esta interfaz, sin tocar una línea de lógica de negocio.
 *
 * Regla estricta: el adaptador SÓLO traduce HTTP del proveedor a estos tipos.
 * Toda mutación de estado vive en payment.service.ts::applyWebhookEvent.
 */
export interface PaymentProvider {
  readonly id: "mock" | "mercadopago" | "flow" | "transbank";
  readonly displayName: string;
  createCheckout(req: CheckoutRequest): Promise<CheckoutSession>;
  parseWebhook(req: WebhookRequest): Promise<WebhookEvent>;
  getPayment(providerPaymentId: string): Promise<PaymentSnapshot>;
  refund(req: RefundRequest): Promise<RefundResult>;
}
