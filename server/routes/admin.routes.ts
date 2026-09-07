import { Router } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { wrap } from "../middleware/errorHandler";
import { requireRole } from "../middleware/requireRole";

export const adminRouter = Router();
const owner = requireRole("owner");
const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];

/* --------------------------------- Planes -------------------------------- */
/* El sitio ya no procesa pagos ni reservas (Javiera usa CrossHero para eso).
   Lo que queda es contenido de marketing que ella edita: precios que se
   MUESTRAN, descripciones de clases, leads de contacto y la base de
   conocimiento para el futuro agente de WhatsApp. */

adminRouter.get("/plans", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, slug, name, segment::text AS segment, period_months AS "periodMonths", credits,
           price_clp AS "priceClp", validity_days AS "validityDays",
           requires_verification AS "requiresVerification", is_drop_in AS "isDropIn",
           allowed_weekdays AS "allowedWeekdays", allowed_time_from::text AS "allowedTimeFrom",
           allowed_time_to::text AS "allowedTimeTo", is_public AS "isPublic", is_active AS "isActive",
           sort_order AS "sortOrder", badge
      FROM plans ORDER BY sort_order, price_clp`));
  res.json({ data: rows });
}));

adminRouter.patch("/plans/:id", owner, wrap(async (req, res) => {
  const input = z.object({
    name: z.string().min(2).optional(),
    priceClp: z.number().int().min(0).optional(),
    credits: z.number().int().min(1).optional(),
    validityDays: z.number().int().min(1).optional(),
    isPublic: z.boolean().optional(),
    isActive: z.boolean().optional(),
    badge: z.string().max(40).nullable().optional(),
  }).parse(req.body);

  const sets = [];
  if (input.name !== undefined) sets.push(sql`name = ${input.name}`);
  if (input.priceClp !== undefined) sets.push(sql`price_clp = ${input.priceClp}`);
  if (input.credits !== undefined) sets.push(sql`credits = ${input.credits}`);
  if (input.validityDays !== undefined) sets.push(sql`validity_days = ${input.validityDays}`);
  if (input.isPublic !== undefined) sets.push(sql`is_public = ${input.isPublic}`);
  if (input.isActive !== undefined) sets.push(sql`is_active = ${input.isActive}`);
  if (input.badge !== undefined) sets.push(sql`badge = ${input.badge}`);
  if (!sets.length) return res.json({ data: { ok: true } });

  await db.execute(sql`UPDATE plans SET ${sql.join(sets, sql`, `)} WHERE id = ${req.params.id}::uuid`);
  res.json({ data: { ok: true } });
}));

/* -------------------------------- Clases --------------------------------- */

adminRouter.get("/class-types", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, slug, name, short_description AS "shortDescription", description,
           discipline::text AS discipline, level::text AS level,
           default_duration_min AS "defaultDurationMin", default_capacity AS "defaultCapacity",
           drop_in_price_clp AS "dropInPriceClp", color, is_public AS "isPublic", is_active AS "isActive"
      FROM class_types ORDER BY sort_order`));
  res.json({ data: rows });
}));

adminRouter.patch("/class-types/:id", owner, wrap(async (req, res) => {
  const input = z.object({
    name: z.string().min(2).optional(),
    shortDescription: z.string().max(200).nullable().optional(),
    description: z.string().max(4000).nullable().optional(),
    dropInPriceClp: z.number().int().min(0).nullable().optional(),
    isPublic: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }).parse(req.body);

  const sets = [];
  if (input.name !== undefined) sets.push(sql`name = ${input.name}`);
  if (input.shortDescription !== undefined) sets.push(sql`short_description = ${input.shortDescription}`);
  if (input.description !== undefined) sets.push(sql`description = ${input.description}`);
  if (input.dropInPriceClp !== undefined) sets.push(sql`drop_in_price_clp = ${input.dropInPriceClp}`);
  if (input.isPublic !== undefined) sets.push(sql`is_public = ${input.isPublic}`);
  if (input.isActive !== undefined) sets.push(sql`is_active = ${input.isActive}`);
  if (!sets.length) return res.json({ data: { ok: true } });

  await db.execute(sql`UPDATE class_types SET ${sql.join(sets, sql`, `)} WHERE id = ${req.params.id}::uuid`);
  res.json({ data: { ok: true } });
}));

/* --------------------- Configuración y base de conocimiento -------------------- */
/* Reutiliza la tabla `settings` (key/value) que ya existía: la base de
   conocimiento para el agente de WhatsApp se guarda bajo la key
   "businessKnowledge", sin necesitar una tabla nueva. */

adminRouter.get("/settings", owner, wrap(async (_req, res) => {
  const { getSettings } = await import("../services/settings.service");
  res.json({ data: await getSettings() });
}));

adminRouter.patch("/settings", owner, wrap(async (req, res) => {
  const entries = Object.entries(req.body ?? {});
  for (const [key, value] of entries) {
    await db.execute(sql`
      INSERT INTO settings (key, value, updated_by) VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${req.user!.id}::uuid)
      ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=now()`);
  }
  res.json({ data: { actualizadas: entries.length } });
}));

/* --------------------------------- Leads ---------------------------------- */

adminRouter.get("/leads", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, name, email, phone, message, interest, status::text AS status, created_at AS "createdAt"
      FROM contact_leads ORDER BY created_at DESC LIMIT 100`));
  res.json({ data: rows });
}));
