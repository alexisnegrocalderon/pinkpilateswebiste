import { Router } from "express";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { classTypes, contactLeads, plans } from "@shared/schema";
import { db } from "../db/client";
import { appUrl, env } from "../env";
import { wrap } from "../middleware/errorHandler";
import { checkoutRateLimit } from "../middleware/rateLimit";
import { hmac } from "../lib/tokens";
import { getPaymentProvider, mockProvider } from "../payments";
import { createPlanOrder, getOrder } from "../services/order.service";
import { applyWebhookEvent, createPaymentRecord } from "../services/payment.service";

export const publicRouter = Router();

publicRouter.get(
  "/class-types",
  wrap(async (_req, res) => {
    const rows = await db
      .select()
      .from(classTypes)
      .where(and(eq(classTypes.isActive, true), eq(classTypes.isPublic, true)))
      .orderBy(asc(classTypes.sortOrder));
    res.json({ data: rows });
  }),
);

publicRouter.get(
  "/plans",
  wrap(async (_req, res) => {
    const rows = await db
      .select()
      .from(plans)
      .where(and(eq(plans.isActive, true), eq(plans.isPublic, true)))
      .orderBy(asc(plans.sortOrder), asc(plans.priceClp));
    res.json({ data: rows });
  }),
);

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().optional(),
  message: z.string().trim().max(2000).optional(),
  interest: z.string().trim().max(120).optional(),
});

publicRouter.post(
  "/contact",
  wrap(async (req, res) => {
    const input = contactSchema.parse(req.body);
    await db.insert(contactLeads).values(input);
    res.status(201).json({ data: { ok: true } });
  }),
);

/* ------------------------------------------------------------------ */
/* Compra de un plan, sin cuenta previa: el sitio vende directo.       */
/* ------------------------------------------------------------------ */

const checkoutSchema = z.object({
  planSlug: z.string().min(1),
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(6).optional(),
});

publicRouter.post(
  "/checkout",
  checkoutRateLimit,
  wrap(async (req, res) => {
    const input = checkoutSchema.parse(req.body);
    const order = await createPlanOrder(input, input.planSlug);

    const provider = getPaymentProvider();
    const session = await provider.createCheckout({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      amountClp: order.totalClp,
      description: order.description,
      customer: { id: order.studentId, email: input.email, name: input.name },
      returnUrl: `${appUrl()}/pago/resultado?orderId=${order.orderId}`,
      cancelUrl: `${appUrl()}/planes`,
      webhookUrl: `${appUrl()}/api/webhooks/payments/${provider.id}`,
      idempotencyKey: `order-${order.orderId}`,
    });

    await createPaymentRecord({
      orderId: order.orderId,
      provider: provider.id,
      providerPaymentId: session.providerPaymentId,
      amountClp: order.totalClp,
      redirectUrl: session.redirectUrl,
    });

    res.status(201).json({ data: { orderId: order.orderId, redirectUrl: session.redirectUrl } });
  }),
);

publicRouter.get(
  "/checkout/orders/:id",
  wrap(async (req, res) => {
    const order = await getOrder(req.params.id);
    res.json({ data: order });
  }),
);

/* Pagador simulado — sólo activo mientras PAYMENTS_PROVIDER=mock. */

publicRouter.get(
  "/checkout/mock/:token",
  wrap(async (req, res) => {
    const payload = mockProvider.readToken(req.params.token);
    if (!payload) {
      return res.status(410).json({ error: { code: "ORDER_EXPIRED", message: "Este enlace de pago venció." } });
    }
    res.json({ data: payload });
  }),
);

publicRouter.post(
  "/checkout/mock/:token/:outcome",
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
