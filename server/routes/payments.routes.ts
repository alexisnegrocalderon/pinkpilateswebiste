import { Router } from "express";
import { z } from "zod";
import { appUrl, env } from "../env";
import { hmac } from "../lib/tokens";
import { wrap } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/requireRole";
import { getPaymentProvider, mockProvider } from "../payments";
import { createPlanOrder, getOrder } from "../services/order.service";
import { applyWebhookEvent, createPaymentRecord } from "../services/payment.service";

export const paymentsRouter = Router();
export const webhooksRouter = Router();

const createOrderSchema = z.object({ planSlug: z.string().min(1) });

paymentsRouter.post(
  "/orders",
  requireAuth,
  wrap(async (req, res) => {
    const { planSlug } = createOrderSchema.parse(req.body);
    const order = await createPlanOrder(req.user!.id, planSlug);
    res.status(201).json({ data: order });
  }),
);

paymentsRouter.get(
  "/orders/:id",
  requireAuth,
  wrap(async (req, res) => {
    const order = await getOrder(req.params.id, req.user!.role === "owner" ? undefined : req.user!.id);
    res.json({ data: order });
  }),
);

paymentsRouter.post(
  "/orders/:id/checkout",
  requireAuth,
  wrap(async (req, res) => {
    const order = (await getOrder(req.params.id, req.user!.id)) as Record<string, any>;
    if (order.status === "paid") {
      return res.json({ data: { alreadyPaid: true, redirectUrl: `/pago/resultado?orderId=${order.id}` } });
    }

    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      orderId: String(order.id),
      orderNumber: String(order.orderNumber),
      amountClp: Number(order.totalClp),
      description: order.items?.[0]?.description ?? "Plan Pink Pilates",
      customer: {
        id: req.user!.id,
        email: req.user!.email,
        name: `${req.user!.firstName} ${req.user!.lastName}`,
      },
      returnUrl: `${appUrl()}/pago/resultado?orderId=${order.id}`,
      cancelUrl: `${appUrl()}/planes`,
      webhookUrl: `${appUrl()}/api/webhooks/payments/${provider.id}`,
      idempotencyKey: `order-${order.id}`,
    });

    await createPaymentRecord({
      orderId: String(order.id),
      provider: provider.id,
      providerPaymentId: session.providerPaymentId,
      amountClp: Number(order.totalClp),
      redirectUrl: session.redirectUrl,
    });

    res.json({ data: { redirectUrl: session.redirectUrl, provider: provider.id } });
  }),
);

/* ------------------------------------------------------------------ */
/* Pagador simulado. Sólo existe cuando PAYMENTS_PROVIDER=mock.        */
/* ------------------------------------------------------------------ */

paymentsRouter.get(
  "/payments/mock/:token",
  wrap(async (req, res) => {
    const payload = mockProvider.readToken(req.params.token);
    if (!payload) {
      return res.status(410).json({ error: { code: "ORDER_EXPIRED", message: "Este enlace de pago venció." } });
    }
    res.json({ data: payload });
  }),
);

paymentsRouter.post(
  "/payments/mock/:token/:outcome",
  wrap(async (req, res) => {
    if (env().PAYMENTS_PROVIDER !== "mock") {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "La pasarela simulada está desactivada." } });
    }
    const payload = mockProvider.readToken(req.params.token);
    if (!payload) {
      return res.status(410).json({ error: { code: "ORDER_EXPIRED", message: "Este enlace de pago venció." } });
    }

    const outcome = req.params.outcome === "approved" ? "payment.paid" : "payment.failed";
    const body = JSON.stringify({
      event_id: `mock_evt_${payload.providerPaymentId}_${outcome}`,
      type: outcome,
      payment_id: payload.providerPaymentId,
      order_id: payload.orderId,
      amount: payload.amountClp,
      ts: new Date().toISOString(),
    });

    // Se firma y se procesa por el MISMO camino que un webhook real, incluida
    // la verificación de firma. Así el flujo que se demuestra es el de verdad.
    const event = await mockProvider.parseWebhook({
      headers: { "x-mock-signature": hmac(env().MOCK_WEBHOOK_SECRET, body) },
      rawBody: Buffer.from(body),
      query: {},
    });
    if (!event.signatureValid) {
      return res.status(401).json({ error: { code: "FORBIDDEN", message: "Firma inválida." } });
    }

    const result = await applyWebhookEvent("mock", event);
    res.json({ data: { ...result, returnUrl: `/pago/resultado?orderId=${payload.orderId}` } });
  }),
);

/* ------------------------------------------------------------------ */
/* Webhook real. Montado bajo /api/webhooks, donde el body llega crudo. */
/* ------------------------------------------------------------------ */

webhooksRouter.post(
  "/payments/:provider",
  wrap(async (req, res) => {
    const provider = getPaymentProvider(req.params.provider);
    const event = await provider.parseWebhook({
      headers: req.headers as Record<string, string | string[] | undefined>,
      rawBody: Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {})),
      query: req.query as Record<string, string | undefined>,
    });

    if (!event.signatureValid) {
      return res.status(401).json({ error: { code: "FORBIDDEN", message: "Firma inválida." } });
    }

    const result = await applyWebhookEvent(provider.id, event);
    // Siempre 200 ante duplicados: si respondiéramos error, el proveedor
    // reintentaría para siempre.
    res.json({ data: result });
  }),
);
