import { sql } from "drizzle-orm";
import { fail } from "@shared/domain/errors";
import { db } from "../db/client";
import { formatClp } from "../lib/clp";
import { queueTemplate } from "./email.service";

const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];

async function nextOrderNumber(): Promise<string> {
  const [row] = rowsOf<{ n: number }>(await db.execute(sql`SELECT nextval('order_number_seq')::int AS n`));
  return `PP-${new Date().getFullYear()}-${String(row.n).padStart(6, "0")}`;
}

/**
 * El sitio vende directo, sin cuenta previa: si el email ya existe se reusa
 * ese usuario (por ejemplo si vuelve a comprar), si no se crea uno nuevo sin
 * contraseña — igual que una alumna que la dueña da de alta a mano.
 */
async function upsertBuyer(buyer: { name: string; email: string; phone?: string }): Promise<string> {
  const [existing] = rowsOf<{ id: string }>(
    await db.execute(sql`SELECT id FROM users WHERE email = ${buyer.email}`),
  );
  if (existing) return existing.id;

  const parts = buyer.name.trim().split(/\s+/);
  const firstName = parts[0] ?? buyer.name;
  const lastName = parts.slice(1).join(" ") || "-";

  const [created] = rowsOf<{ id: string }>(
    await db.execute(sql`
      INSERT INTO users (email, role, first_name, last_name, phone)
      VALUES (${buyer.email}, 'student', ${firstName}, ${lastName}, ${buyer.phone ?? null})
      RETURNING id
    `),
  );
  return created.id;
}

/** Compra de un plan, sin sesión previa: se crea (o reusa) la cuenta de la compradora. */
export async function createPlanOrder(buyer: { name: string; email: string; phone?: string }, planSlug: string) {
  const [plan] = rowsOf<{
    id: string; name: string; price_clp: number; credits: number; validity_days: number; requires_verification: boolean;
  }>(
    await db.execute(sql`
      SELECT id, name, price_clp, credits, validity_days, requires_verification
        FROM plans WHERE slug = ${planSlug} AND is_active AND is_public
    `),
  );
  if (!plan) fail("NOT_FOUND", "Ese plan no existe o ya no está disponible.");

  const studentId = await upsertBuyer(buyer);
  const orderNumber = await nextOrderNumber();
  const [order] = rowsOf<{ id: string }>(
    await db.execute(sql`
      INSERT INTO orders (order_number, student_id, status, subtotal_clp, discount_clp, total_clp, expires_at)
      VALUES (${orderNumber}, ${studentId}::uuid, 'awaiting_payment', ${plan.price_clp}, 0, ${plan.price_clp},
              now() + INTERVAL '30 minutes')
      RETURNING id
    `),
  );
  await db.execute(sql`
    INSERT INTO order_items (order_id, kind, plan_id, description, unit_price_clp, quantity, total_clp)
    VALUES (${order.id}::uuid, 'plan', ${plan.id}::uuid, ${plan.name}, ${plan.price_clp}, 1, ${plan.price_clp})
  `);

  return { orderId: order.id, orderNumber, totalClp: plan.price_clp, description: plan.name, studentId };
}

/**
 * Cumplimiento de la orden. Es idempotente por diseño: si el webhook llega dos
 * veces, la segunda no crea una segunda membresía.
 *
 * No toca reservas: la reserva de la clase la hace la alumna directo en su
 * app de CrossHero una vez que su plan está activo, esto sólo vende el plan.
 */
export async function fulfillOrder(orderId: string): Promise<boolean> {
  const [order] = rowsOf<{
    id: string; student_id: string; order_number: string; status: string; total_clp: number; email: string; first_name: string;
  }>(
    await db.execute(sql`
      SELECT o.id, o.student_id, o.order_number, o.status::text AS status, o.total_clp, u.email, u.first_name
        FROM orders o JOIN users u ON u.id = o.student_id
       WHERE o.id = ${orderId}::uuid
    `),
  );
  if (!order) return false;

  const [already] = rowsOf<{ n: number }>(
    await db.execute(sql`SELECT count(*)::int AS n FROM memberships WHERE order_id = ${orderId}::uuid`),
  );
  if (already.n > 0) return false; // ya cumplida

  const items = rowsOf<{ kind: string; plan_id: string | null }>(
    await db.execute(sql`SELECT kind::text AS kind, plan_id FROM order_items WHERE order_id = ${orderId}::uuid`),
  );

  for (const item of items) {
    if (!item.plan_id) continue;
    const [plan] = rowsOf<{ credits: number; validity_days: number; requires_verification: boolean; name: string }>(
      await db.execute(sql`SELECT credits, validity_days, requires_verification, name FROM plans WHERE id = ${item.plan_id}::uuid`),
    );

    // El plan estudiante nace pendiente: la dueña debe ver el certificado de
    // alumno regular antes de que los créditos sean utilizables.
    const status = plan.requires_verification ? "pending_verification" : "active";

    const [m] = rowsOf<{ id: string }>(
      await db.execute(sql`
        INSERT INTO memberships (student_id, plan_id, order_id, status, credits_total, credits_used,
                                 starts_on, ends_on, activated_at, price_paid_clp)
        VALUES (${order.student_id}::uuid, ${item.plan_id}::uuid, ${orderId}::uuid, ${status}::membership_status,
                ${plan.credits}, 0,
                (now() AT TIME ZONE 'America/Santiago')::date,
                (now() AT TIME ZONE 'America/Santiago')::date + ${plan.validity_days}::int,
                now(), ${order.total_clp})
        RETURNING id
      `),
    );
    await db.execute(sql`
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, order_id, note)
      VALUES (${m.id}::uuid, ${order.student_id}::uuid, ${plan.credits}, 'purchase', ${orderId}::uuid,
              ${"Compra " + order.order_number})
    `);

    await queueTemplate("payment_receipt", order.student_id, order.email, {
      nombre: order.first_name,
      orden: order.order_number,
      plan: plan.name,
      monto: formatClp(order.total_clp),
      creditos: plan.credits,
    });
  }

  return true;
}

export async function getOrder(orderId: string) {
  const [order] = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
             o.subtotal_clp AS "subtotalClp", o.discount_clp AS "discountClp", o.total_clp AS "totalClp",
             o.expires_at AS "expiresAt", o.paid_at AS "paidAt",
             (SELECT json_agg(json_build_object('description', oi.description, 'kind', oi.kind,
                                                'totalClp', oi.total_clp))
                FROM order_items oi WHERE oi.order_id = o.id) AS items
        FROM orders o WHERE o.id = ${orderId}::uuid
    `),
  );
  if (!order) fail("NOT_FOUND", "Esa orden no existe.");
  return order;
}
