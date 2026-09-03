import { Router } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { wrap } from "../middleware/errorHandler";
import { requireRole } from "../middleware/requireRole";
import { cancelBooking, createBooking } from "../services/booking.service";
import { queueTemplate } from "../services/email.service";
import { materializeSessions } from "../services/schedule.service";
import { promoteFromWaitlist } from "../services/waitlist.service";

export const adminRouter = Router();
const owner = requireRole("owner");
const staff = requireRole("owner", "instructor");
const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];
const one = async <T>(q: ReturnType<typeof sql>) => rowsOf<T>(await db.execute(q))[0];

/* ------------------------------- Resumen ------------------------------- */

adminRouter.get(
  "/overview",
  owner,
  wrap(async (_req, res) => {
    const kpis = await one<Record<string, number>>(sql`
      SELECT
        (SELECT COALESCE(sum(total_clp),0)::int FROM orders
          WHERE status='paid'
            AND (paid_at AT TIME ZONE 'America/Santiago')
                >= date_trunc('month', now() AT TIME ZONE 'America/Santiago')) AS "ingresosMes",
        -- Mismo tramo de dias del mes anterior, no el mes completo: comparar el
        -- dia 2 de septiembre contra todo agosto siempre daria una caida falsa.
        (SELECT COALESCE(sum(total_clp),0)::int FROM orders
          WHERE status='paid'
            AND (paid_at AT TIME ZONE 'America/Santiago')
                >= date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - INTERVAL '1 month')
            AND (paid_at AT TIME ZONE 'America/Santiago')
                <  date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - INTERVAL '1 month')
                   + ((now() AT TIME ZONE 'America/Santiago') - date_trunc('month', now() AT TIME ZONE 'America/Santiago'))
          ) AS "ingresosMesAnterior",
        (SELECT count(*)::int FROM reservations r JOIN class_sessions s ON s.id=r.session_id
          WHERE r.status IN ('booked','attended')
            AND s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date
            AND s.local_date <  (now() AT TIME ZONE 'America/Santiago')::date + 7) AS "reservasSemana",
        (SELECT count(DISTINCT student_id)::int FROM memberships
          WHERE status='active' AND ends_on >= (now() AT TIME ZONE 'America/Santiago')::date) AS "alumnasActivas",
        (SELECT count(*)::int FROM memberships
          WHERE status='active' AND ends_on BETWEEN (now() AT TIME ZONE 'America/Santiago')::date
            AND (now() AT TIME ZONE 'America/Santiago')::date + 7) AS "planesPorVencer",
        (SELECT count(*)::int FROM memberships WHERE status='pending_verification') AS "porVerificar",
        (SELECT count(*)::int FROM reservations r JOIN class_sessions s ON s.id=r.session_id
          WHERE r.status='no_show' AND s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30) AS "noShowsMes",
        (SELECT count(*)::int FROM contact_leads WHERE status='new') AS "contactosNuevos"
    `);

    const ocupacion = await one<{ ocupadas: number; ofrecidas: number }>(sql`
      SELECT COALESCE(sum(booked_count),0)::int AS ocupadas, COALESCE(sum(capacity),0)::int AS ofrecidas
        FROM class_sessions
       WHERE status='scheduled'
         AND local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30
         AND local_date <  (now() AT TIME ZONE 'America/Santiago')::date
    `);

    const hoy = rowsOf(await db.execute(sql`
      SELECT s.id, s.start_time::text AS "startTime", ct.name AS "className", ct.color,
             s.booked_count AS "bookedCount", s.capacity, s.waitlist_count AS "waitlistCount",
             rm.name AS "roomName", COALESCE(i.first_name,'Sin asignar') AS "instructorName",
             s.status::text AS status
        FROM class_sessions s
        JOIN class_types ct ON ct.id=s.class_type_id
        JOIN rooms rm ON rm.id=s.room_id
        LEFT JOIN users i ON i.id=s.instructor_id
       WHERE s.local_date = (now() AT TIME ZONE 'America/Santiago')::date
       ORDER BY s.start_time
    `));

    const ingresos = rowsOf(await db.execute(sql`
      SELECT to_char(date_trunc('month', paid_at AT TIME ZONE 'America/Santiago'),'YYYY-MM') AS mes,
             sum(total_clp)::int AS total, count(*)::int AS ordenes
        FROM orders WHERE status='paid' AND paid_at >= now() - INTERVAL '6 months'
       GROUP BY 1 ORDER BY 1
    `));

    const porClase = rowsOf(await db.execute(sql`
      SELECT ct.name AS clase, ct.color,
             COALESCE(sum(s.booked_count),0)::int AS reservas,
             COALESCE(sum(s.capacity),0)::int AS cupos,
             CASE WHEN sum(s.capacity) > 0
                  THEN round(100.0 * sum(s.booked_count) / sum(s.capacity))::int ELSE 0 END AS ocupacion
        FROM class_sessions s JOIN class_types ct ON ct.id=s.class_type_id
       WHERE s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30
         AND s.local_date < (now() AT TIME ZONE 'America/Santiago')::date
       GROUP BY ct.name, ct.color ORDER BY reservas DESC
    `));

    res.json({
      data: {
        ...kpis,
        ocupacionPct: ocupacion.ofrecidas ? Math.round((100 * ocupacion.ocupadas) / ocupacion.ofrecidas) : 0,
        clasesHoy: hoy,
        ingresosPorMes: ingresos,
        ocupacionPorClase: porClase,
      },
    });
  }),
);

/* -------------------------------- Agenda -------------------------------- */

adminRouter.get(
  "/calendar",
  staff,
  wrap(async (req, res) => {
    const from = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().parse(req.query.from);
    const to = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().parse(req.query.to);

    const rows = rowsOf(await db.execute(sql`
      SELECT s.id, s.local_date::text AS "localDate", s.start_time::text AS "startTime",
             s.starts_at AS "startsAt", s.duration_min AS "durationMin",
             s.capacity, s.booked_count AS "bookedCount", s.waitlist_count AS "waitlistCount",
             s.status::text AS status, s.notes,
             ct.id AS "classTypeId", ct.name AS "className", ct.color,
             rm.id AS "roomId", rm.name AS "roomName",
             i.id AS "instructorId", COALESCE(i.first_name || ' ' || i.last_name, 'Sin asignar') AS "instructorName"
        FROM class_sessions s
        JOIN class_types ct ON ct.id=s.class_type_id
        JOIN rooms rm ON rm.id=s.room_id
        LEFT JOIN users i ON i.id=s.instructor_id
       WHERE s.local_date >= COALESCE(${from ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date)
         AND s.local_date <= COALESCE(${to ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date + 6)
       ORDER BY s.starts_at
    `));
    res.json({ data: rows });
  }),
);

adminRouter.get(
  "/sessions/:id/roster",
  staff,
  wrap(async (req, res) => {
    const session = await one<Record<string, unknown>>(sql`
      SELECT s.id, s.local_date::text AS "localDate", s.start_time::text AS "startTime",
             s.starts_at AS "startsAt", s.capacity, s.booked_count AS "bookedCount",
             s.status::text AS status, s.notes,
             ct.name AS "className", rm.name AS "roomName",
             COALESCE(i.first_name || ' ' || i.last_name, 'Sin asignar') AS "instructorName"
        FROM class_sessions s
        JOIN class_types ct ON ct.id=s.class_type_id
        JOIN rooms rm ON rm.id=s.room_id
        LEFT JOIN users i ON i.id=s.instructor_id
       WHERE s.id=${req.params.id}::uuid
    `);
    if (!session) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa clase no existe." } });

    const inscritas = rowsOf(await db.execute(sql`
      SELECT r.id, r.status::text AS status, r.checked_in_at AS "checkedInAt", r.source::text AS source,
             u.id AS "studentId", u.first_name AS "firstName", u.last_name AS "lastName", u.phone,
             p.name AS "planName", (m.credits_total - m.credits_used) AS "creditsRemaining",
             (SELECT count(*)::int FROM reservations rr
               WHERE rr.student_id=u.id AND rr.status='no_show') AS "noShowsTotal"
        FROM reservations r
        JOIN users u ON u.id=r.student_id
        LEFT JOIN memberships m ON m.id=r.membership_id
        LEFT JOIN plans p ON p.id=m.plan_id
       WHERE r.session_id=${req.params.id}::uuid AND r.status IN ('booked','attended','no_show')
       ORDER BY u.first_name
    `));

    const espera = rowsOf(await db.execute(sql`
      SELECT w.id, w.status::text AS status, w.created_at AS "createdAt",
             u.id AS "studentId", u.first_name AS "firstName", u.last_name AS "lastName"
        FROM waitlist_entries w JOIN users u ON u.id=w.student_id
       WHERE w.session_id=${req.params.id}::uuid AND w.status IN ('waiting','offered')
       ORDER BY w.created_at
    `));

    res.json({ data: { session, inscritas, espera } });
  }),
);

const attendanceSchema = z.object({
  marks: z.array(z.object({ reservationId: z.string().uuid(), present: z.boolean() })),
});

adminRouter.post(
  "/sessions/:id/attendance",
  staff,
  wrap(async (req, res) => {
    const { marks } = attendanceSchema.parse(req.body);
    for (const m of marks) {
      await db.execute(sql`
        UPDATE reservations
           SET status = ${m.present ? "attended" : "no_show"}::reservation_status,
               checked_in_at = ${m.present ? sql`now()` : sql`NULL`},
               marked_by = ${req.user!.id}::uuid, updated_at = now()
         WHERE id = ${m.reservationId}::uuid AND session_id = ${req.params.id}::uuid
      `);
    }
    await db.execute(sql`UPDATE class_sessions SET status='completed' WHERE id=${req.params.id}::uuid AND starts_at < now()`);
    res.json({ data: { marcadas: marks.length } });
  }),
);

adminRouter.post(
  "/sessions/:id/cancel",
  owner,
  wrap(async (req, res) => {
    const reason = z.string().max(500).optional().parse(req.body?.reason);

    const afectadas = rowsOf<{ id: string; student_id: string; email: string; first_name: string }>(
      await db.execute(sql`
        SELECT r.id, r.student_id, u.email, u.first_name
          FROM reservations r JOIN users u ON u.id=r.student_id
         WHERE r.session_id=${req.params.id}::uuid AND r.status='booked'
      `),
    );

    const info = await one<{ class_name: string; local_date: string; start_time: string }>(sql`
      SELECT ct.name AS class_name, s.local_date::text AS local_date, s.start_time::text AS start_time
        FROM class_sessions s JOIN class_types ct ON ct.id=s.class_type_id WHERE s.id=${req.params.id}::uuid
    `);

    // Se devuelve el crédito SIEMPRE, sin importar la antelación.
    for (const r of afectadas) {
      await cancelBooking(r.id, req.user!.id, { asStudio: true });
      await queueTemplate("class_cancelled_by_studio", r.student_id, r.email, {
        nombre: r.first_name, clase: info.class_name, fecha: info.local_date, hora: info.start_time.slice(0, 5),
      }, { dedupeKey: `session_cancel:${req.params.id}:${r.student_id}` });
    }

    await db.execute(sql`
      UPDATE class_sessions
         SET status='cancelled', cancelled_at=now(), cancelled_by=${req.user!.id}::uuid,
             cancellation_reason=${reason ?? null}, updated_at=now()
       WHERE id=${req.params.id}::uuid
    `);
    await db.execute(sql`
      UPDATE waitlist_entries SET status='cancelled'
       WHERE session_id=${req.params.id}::uuid AND status IN ('waiting','offered')
    `);
    await db.execute(sql`
      INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id, summary)
      VALUES (${req.user!.id}::uuid, 'owner', 'session.cancel', 'class_session', ${req.params.id}::uuid,
              ${`Canceló ${info.class_name} del ${info.local_date} ${info.start_time.slice(0, 5)}. ${afectadas.length} alumna(s) con crédito devuelto.`})
    `);

    res.json({ data: { afectadas: afectadas.length, creditosDevueltos: afectadas.length } });
  }),
);

adminRouter.patch(
  "/sessions/:id",
  owner,
  wrap(async (req, res) => {
    const input = z.object({
      capacity: z.number().int().min(1).max(50).optional(),
      instructorId: z.string().uuid().nullable().optional(),
      notes: z.string().max(1000).optional(),
    }).parse(req.body);

    if (input.capacity !== undefined) {
      const current = await one<{ booked_count: number }>(sql`SELECT booked_count FROM class_sessions WHERE id=${req.params.id}::uuid`);
      if (input.capacity < current.booked_count) {
        return res.status(409).json({
          error: { code: "CONFLICT", message: `Ya hay ${current.booked_count} inscritas: el cupo no puede ser menor.` },
        });
      }
      await db.execute(sql`UPDATE class_sessions SET capacity=${input.capacity}, updated_at=now() WHERE id=${req.params.id}::uuid`);
      // Subir el cupo puede permitir entrar a quien está esperando.
      await promoteFromWaitlist(req.params.id);
    }
    if (input.instructorId !== undefined) {
      await db.execute(sql`UPDATE class_sessions SET instructor_id=${input.instructorId}::uuid, updated_at=now() WHERE id=${req.params.id}::uuid`);
    }
    if (input.notes !== undefined) {
      await db.execute(sql`UPDATE class_sessions SET notes=${input.notes}, updated_at=now() WHERE id=${req.params.id}::uuid`);
    }
    res.json({ data: { ok: true } });
  }),
);

adminRouter.post(
  "/sessions/:id/reservations",
  owner,
  wrap(async (req, res) => {
    const { studentId } = z.object({ studentId: z.string().uuid() }).parse(req.body);
    const result = await createBooking(studentId, req.params.id, "admin");
    res.status(201).json({ data: result });
  }),
);

adminRouter.delete(
  "/reservations/:id",
  owner,
  wrap(async (req, res) => {
    const waive = req.query.waivePenalty === "true";
    const info = await one<{ session_id: string }>(sql`SELECT session_id FROM reservations WHERE id=${req.params.id}::uuid`);
    const outcome = await cancelBooking(req.params.id, req.user!.id, { waivePenalty: waive });
    if (info) await promoteFromWaitlist(info.session_id);
    res.json({ data: outcome });
  }),
);

/* ------------------------------- Alumnas ------------------------------- */

adminRouter.get(
  "/students",
  owner,
  wrap(async (req, res) => {
    const q = (req.query.q as string | undefined)?.trim() || null;
    const estado = (req.query.estado as string | undefined) || null;

    const rows = rowsOf(await db.execute(sql`
      SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
             u.status::text AS status, sp.joined_at AS "joinedAt",
             m.plan_name AS "planName", m.credits_remaining AS "creditsRemaining",
             m.ends_on AS "endsOn", m.membership_status AS "membershipStatus",
             m.days_left AS "daysLeft",
             (SELECT max(s.starts_at) FROM reservations r JOIN class_sessions s ON s.id=r.session_id
               WHERE r.student_id=u.id AND r.status='attended') AS "lastVisit",
             (SELECT count(*)::int FROM reservations r WHERE r.student_id=u.id AND r.status='no_show') AS "noShows",
             (SELECT count(*)::int FROM reservations r WHERE r.student_id=u.id AND r.status='attended') AS "clasesTomadas"
        FROM users u
        LEFT JOIN student_profiles sp ON sp.user_id=u.id
        LEFT JOIN LATERAL (
          SELECT p.name AS plan_name, (mm.credits_total - mm.credits_used) AS credits_remaining,
                 mm.ends_on::text AS ends_on, mm.status::text AS membership_status,
                 (mm.ends_on - (now() AT TIME ZONE 'America/Santiago')::date)::int AS days_left
            FROM memberships mm JOIN plans p ON p.id=mm.plan_id
           WHERE mm.student_id=u.id AND mm.status IN ('active','pending_verification')
           ORDER BY mm.ends_on DESC LIMIT 1
        ) m ON true
       WHERE u.role='student'
         AND (${q}::text IS NULL OR (u.first_name || ' ' || u.last_name || ' ' || u.email) ILIKE '%' || ${q}::text || '%')
         AND (${estado}::text IS NULL
              OR (${estado}::text = 'activas' AND m.membership_status = 'active')
              OR (${estado}::text = 'sin_plan' AND m.membership_status IS NULL)
              OR (${estado}::text = 'por_vencer' AND m.membership_status = 'active' AND m.days_left <= 7)
              OR (${estado}::text = 'por_verificar' AND m.membership_status = 'pending_verification'))
       ORDER BY u.first_name, u.last_name
    `));
    res.json({ data: rows });
  }),
);

adminRouter.get(
  "/students/:id",
  owner,
  wrap(async (req, res) => {
    const id = req.params.id;
    const perfil = await one(sql`
      SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
             u.status::text AS status, u.birth_date::text AS "birthDate", u.last_login_at AS "lastLoginAt",
             sp.emergency_contact_name AS "emergencyContactName", sp.emergency_contact_phone AS "emergencyContactPhone",
             sp.health_notes AS "healthNotes", sp.goals, sp.internal_notes AS "internalNotes",
             sp.marketing_opt_in AS "marketingOptIn", sp.joined_at AS "joinedAt"
        FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.id=${id}::uuid AND u.role='student'
    `);
    if (!perfil) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa alumna no existe." } });

    const [membresias, reservas, creditos, ordenes] = await Promise.all([
      db.execute(sql`
        SELECT m.id, p.name AS "planName", p.segment::text AS segment, m.status::text AS status,
               m.credits_total AS "creditsTotal", m.credits_used AS "creditsUsed",
               (m.credits_total - m.credits_used) AS "creditsRemaining",
               m.starts_on::text AS "startsOn", m.ends_on::text AS "endsOn", m.price_paid_clp AS "pricePaidClp"
          FROM memberships m JOIN plans p ON p.id=m.plan_id
         WHERE m.student_id=${id}::uuid ORDER BY m.starts_on DESC`),
      db.execute(sql`
        SELECT r.id, r.status::text AS status, s.local_date::text AS "localDate",
               s.start_time::text AS "startTime", ct.name AS "className"
          FROM reservations r JOIN class_sessions s ON s.id=r.session_id
          JOIN class_types ct ON ct.id=s.class_type_id
         WHERE r.student_id=${id}::uuid ORDER BY s.starts_at DESC LIMIT 40`),
      db.execute(sql`
        SELECT ct.id, ct.delta, ct.reason::text AS reason, ct.note, ct.created_at AS "createdAt"
          FROM credit_transactions ct WHERE ct.student_id=${id}::uuid ORDER BY ct.created_at DESC LIMIT 40`),
      db.execute(sql`
        SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
               o.total_clp AS "totalClp", o.paid_at AS "paidAt", o.created_at AS "createdAt"
          FROM orders o WHERE o.student_id=${id}::uuid ORDER BY o.created_at DESC LIMIT 20`),
    ]);

    res.json({
      data: {
        perfil,
        membresias: rowsOf(membresias),
        reservas: rowsOf(reservas),
        creditos: rowsOf(creditos),
        ordenes: rowsOf(ordenes),
      },
    });
  }),
);

adminRouter.post(
  "/students/:id/memberships",
  owner,
  wrap(async (req, res) => {
    const { planSlug, marcarPagado } = z.object({
      planSlug: z.string(), marcarPagado: z.boolean().default(true),
    }).parse(req.body);

    const plan = await one<{ id: string; credits: number; validity_days: number; price_clp: number; name: string }>(
      sql`SELECT id, credits, validity_days, price_clp, name FROM plans WHERE slug=${planSlug}`,
    );
    if (!plan) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ese plan no existe." } });

    const m = await one<{ id: string }>(sql`
      INSERT INTO memberships (student_id, plan_id, status, credits_total, credits_used,
                               starts_on, ends_on, activated_at, price_paid_clp)
      VALUES (${req.params.id}::uuid, ${plan.id}::uuid, 'active', ${plan.credits}, 0,
              (now() AT TIME ZONE 'America/Santiago')::date,
              (now() AT TIME ZONE 'America/Santiago')::date + ${plan.validity_days}::int,
              now(), ${marcarPagado ? plan.price_clp : 0})
      RETURNING id
    `);
    await db.execute(sql`
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, note, created_by)
      VALUES (${m.id}::uuid, ${req.params.id}::uuid, ${plan.credits}, 'purchase',
              ${"Plan otorgado desde el panel: " + plan.name}, ${req.user!.id}::uuid)
    `);
    res.status(201).json({ data: { membershipId: m.id } });
  }),
);

adminRouter.post(
  "/memberships/:id/verify",
  owner,
  wrap(async (req, res) => {
    await db.execute(sql`
      UPDATE memberships SET status='active', verified_by=${req.user!.id}::uuid, verified_at=now(),
             activated_at=COALESCE(activated_at, now()), updated_at=now()
       WHERE id=${req.params.id}::uuid AND status='pending_verification'
    `);
    res.json({ data: { ok: true } });
  }),
);

adminRouter.post(
  "/memberships/:id/credits",
  owner,
  wrap(async (req, res) => {
    const { delta, note } = z.object({
      delta: z.number().int().refine((n) => n !== 0, "El ajuste no puede ser cero"),
      note: z.string().min(3, "Explica el motivo del ajuste"),
    }).parse(req.body);

    const m = await one<{ student_id: string; credits_total: number; credits_used: number }>(
      sql`SELECT student_id, credits_total, credits_used FROM memberships WHERE id=${req.params.id}::uuid`,
    );
    if (!m) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa membresía no existe." } });

    // Ajustar créditos = mover credits_total, no credits_used: así el historial
    // de consumo sigue siendo fiel a lo que realmente se usó.
    await db.execute(sql`
      UPDATE memberships SET credits_total = GREATEST(credits_used, credits_total + ${delta}), updated_at=now()
       WHERE id=${req.params.id}::uuid
    `);
    await db.execute(sql`
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, note, created_by)
      VALUES (${req.params.id}::uuid, ${m.student_id}::uuid, ${delta}, 'admin_adjust', ${note}, ${req.user!.id}::uuid)
    `);
    await db.execute(sql`
      INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id, summary)
      VALUES (${req.user!.id}::uuid, 'owner', 'membership.credits.adjust', 'membership', ${req.params.id}::uuid,
              ${`Ajustó ${delta > 0 ? "+" : ""}${delta} créditos. Motivo: ${note}`})
    `);
    res.json({ data: { ok: true } });
  }),
);

/* --------------------------- Planes y catálogo --------------------------- */

adminRouter.get("/plans", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, slug, name, segment::text AS segment, period_months AS "periodMonths", credits,
           price_clp AS "priceClp", validity_days AS "validityDays",
           requires_verification AS "requiresVerification", is_drop_in AS "isDropIn",
           allowed_weekdays AS "allowedWeekdays", allowed_time_from::text AS "allowedTimeFrom",
           allowed_time_to::text AS "allowedTimeTo", is_public AS "isPublic", is_active AS "isActive",
           sort_order AS "sortOrder", badge,
           (SELECT count(*)::int FROM memberships m WHERE m.plan_id = plans.id) AS "vendidos"
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

adminRouter.get("/class-types", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, slug, name, short_description AS "shortDescription", discipline::text AS discipline,
           default_capacity AS "defaultCapacity", drop_in_price_clp AS "dropInPriceClp",
           color, is_public AS "isPublic", is_active AS "isActive"
      FROM class_types ORDER BY sort_order`));
  res.json({ data: rows });
}));

adminRouter.get("/rooms", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`SELECT id, name, capacity, description, is_active AS "isActive" FROM rooms ORDER BY name`));
  res.json({ data: rows });
}));

adminRouter.get("/instructors", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email,
           ip.bio, ip.calendar_color AS "calendarColor", ip.is_active AS "isActive",
           (SELECT count(*)::int FROM class_sessions s
             WHERE s.instructor_id=u.id AND s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 30) AS "clasesMes"
      FROM users u JOIN instructor_profiles ip ON ip.user_id=u.id ORDER BY u.first_name`));
  res.json({ data: rows });
}));

/* ------------------------------- Horarios ------------------------------- */

adminRouter.get("/templates", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT t.id, t.weekday, t.start_time::text AS "startTime", t.duration_min AS "durationMin",
           t.capacity, t.is_active AS "isActive", t.effective_from::text AS "effectiveFrom",
           t.materialized_through::text AS "materializedThrough",
           ct.id AS "classTypeId", ct.name AS "className", ct.color,
           rm.id AS "roomId", rm.name AS "roomName",
           i.id AS "instructorId", COALESCE(i.first_name,'Sin asignar') AS "instructorName"
      FROM class_templates t
      JOIN class_types ct ON ct.id=t.class_type_id
      JOIN rooms rm ON rm.id=t.room_id
      LEFT JOIN users i ON i.id=t.instructor_id
     ORDER BY t.weekday, t.start_time`));
  res.json({ data: rows });
}));

adminRouter.post("/templates", owner, wrap(async (req, res) => {
  const input = z.object({
    classTypeId: z.string().uuid(),
    roomId: z.string().uuid(),
    instructorId: z.string().uuid().nullable().optional(),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    durationMin: z.number().int().min(15).max(180).default(60),
    capacity: z.number().int().min(1).max(50),
  }).parse(req.body);

  const t = await one<{ id: string }>(sql`
    INSERT INTO class_templates (class_type_id, room_id, instructor_id, weekday, start_time,
                                 duration_min, capacity, effective_from)
    VALUES (${input.classTypeId}::uuid, ${input.roomId}::uuid, ${input.instructorId ?? null}::uuid,
            ${input.weekday}, ${input.startTime}::time, ${input.durationMin}, ${input.capacity},
            (now() AT TIME ZONE 'America/Santiago')::date)
    RETURNING id`);
  const generadas = await materializeSessions();
  res.status(201).json({ data: { templateId: t.id, clasesGeneradas: generadas } });
}));

adminRouter.patch("/templates/:id", owner, wrap(async (req, res) => {
  const input = z.object({
    capacity: z.number().int().min(1).max(50).optional(),
    instructorId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }).parse(req.body);

  const sets = [];
  if (input.capacity !== undefined) sets.push(sql`capacity = ${input.capacity}`);
  if (input.instructorId !== undefined) sets.push(sql`instructor_id = ${input.instructorId}::uuid`);
  if (input.isActive !== undefined) sets.push(sql`is_active = ${input.isActive}`);
  if (sets.length) {
    await db.execute(sql`UPDATE class_templates SET ${sql.join(sets, sql`, `)}, updated_at=now() WHERE id=${req.params.id}::uuid`);
  }
  res.json({ data: { ok: true } });
}));

adminRouter.post("/materialize", owner, wrap(async (req, res) => {
  const through = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().parse(req.body?.through);
  const creadas = await materializeSessions(through);
  res.json({ data: { clasesGeneradas: creadas } });
}));

/* -------------------------------- Pagos -------------------------------- */

adminRouter.get("/orders", owner, wrap(async (req, res) => {
  const estado = (req.query.estado as string | undefined) || null;
  const rows = rowsOf(await db.execute(sql`
    SELECT o.id, o.order_number AS "orderNumber", o.status::text AS status,
           o.total_clp AS "totalClp", o.paid_at AS "paidAt", o.created_at AS "createdAt", o.provider,
           u.id AS "studentId", u.first_name AS "firstName", u.last_name AS "lastName", u.email,
           (SELECT string_agg(oi.description, ', ') FROM order_items oi WHERE oi.order_id=o.id) AS items
      FROM orders o JOIN users u ON u.id=o.student_id
     WHERE (${estado}::text IS NULL OR o.status::text = ${estado}::text)
     ORDER BY o.created_at DESC LIMIT 200`));
  res.json({ data: rows });
}));

adminRouter.post("/orders/:id/mark-paid", owner, wrap(async (req, res) => {
  const { fulfillOrder } = await import("../services/order.service");
  await db.execute(sql`
    UPDATE orders SET status='paid', paid_at=now(), provider='efectivo', updated_at=now()
     WHERE id=${req.params.id}::uuid AND status <> 'paid'`);
  const cumplida = await fulfillOrder(req.params.id);
  await db.execute(sql`
    INSERT INTO audit_log (actor_user_id, actor_role, action, entity_type, entity_id, summary)
    VALUES (${req.user!.id}::uuid, 'owner', 'order.mark_paid', 'order', ${req.params.id}::uuid,
            'Marcó la orden como pagada fuera de línea (efectivo o transferencia).')`);
  res.json({ data: { ok: true, membresiaCreada: cumplida } });
}));

/* ------------------------------- Reportes ------------------------------- */

adminRouter.get("/reports/occupancy", owner, wrap(async (_req, res) => {
  const porHorario = rowsOf(await db.execute(sql`
    SELECT s.start_time::text AS hora, EXTRACT(DOW FROM s.local_date)::int AS dia,
           COALESCE(sum(s.booked_count),0)::int AS reservas,
           COALESCE(sum(s.capacity),0)::int AS cupos,
           CASE WHEN sum(s.capacity) > 0 THEN round(100.0*sum(s.booked_count)/sum(s.capacity))::int ELSE 0 END AS ocupacion
      FROM class_sessions s
     WHERE s.local_date >= (now() AT TIME ZONE 'America/Santiago')::date - 60
       AND s.local_date < (now() AT TIME ZONE 'America/Santiago')::date
     GROUP BY 1,2 ORDER BY 2,1`));
  res.json({ data: { porHorario } });
}));

adminRouter.get("/reports/revenue", owner, wrap(async (_req, res) => {
  const porPlan = rowsOf(await db.execute(sql`
    SELECT p.name AS plan, p.segment::text AS segmento, count(*)::int AS ventas,
           sum(o.total_clp)::int AS total
      FROM orders o JOIN order_items oi ON oi.order_id=o.id JOIN plans p ON p.id=oi.plan_id
     WHERE o.status='paid' GROUP BY p.name, p.segment ORDER BY total DESC`));
  const porMes = rowsOf(await db.execute(sql`
    SELECT to_char(date_trunc('month', paid_at AT TIME ZONE 'America/Santiago'),'YYYY-MM') AS mes,
           sum(total_clp)::int AS total, count(*)::int AS ordenes
      FROM orders WHERE status='paid' GROUP BY 1 ORDER BY 1`));
  res.json({ data: { porPlan, porMes } });
}));

adminRouter.get("/reports/retention", owner, wrap(async (_req, res) => {
  const enRiesgo = rowsOf(await db.execute(sql`
    SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.phone,
           max(s.starts_at) AS "ultimaVisita",
           (now()::date - max(s.starts_at)::date)::int AS "diasSinVenir"
      FROM users u
      JOIN reservations r ON r.student_id=u.id AND r.status='attended'
      JOIN class_sessions s ON s.id=r.session_id
     WHERE u.role='student'
     GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone
    HAVING (now()::date - max(s.starts_at)::date) BETWEEN 14 AND 90
     ORDER BY "diasSinVenir" DESC LIMIT 40`));
  res.json({ data: { enRiesgo } });
}));

/* -------------------------------- Emails -------------------------------- */

adminRouter.get("/email-templates", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, key, name, subject, html_body AS "htmlBody", sample_vars AS "sampleVars",
           is_active AS "isActive", updated_at AS "updatedAt" FROM email_templates ORDER BY key`));
  res.json({ data: rows });
}));

adminRouter.patch("/email-templates/:key", owner, wrap(async (req, res) => {
  const input = z.object({ subject: z.string().min(3).optional(), htmlBody: z.string().min(10).optional() }).parse(req.body);
  const sets = [];
  if (input.subject) sets.push(sql`subject = ${input.subject}`);
  if (input.htmlBody) sets.push(sql`html_body = ${input.htmlBody}`);
  if (sets.length) {
    await db.execute(sql`
      UPDATE email_templates SET ${sql.join(sets, sql`, `)}, updated_by=${req.user!.id}::uuid, updated_at=now()
       WHERE key=${req.params.key}`);
  }
  res.json({ data: { ok: true } });
}));

const audienceSchema = z.object({
  membership: z.enum(["todas", "active", "expiring", "expired", "none"]).default("todas"),
  inactiveDays: z.number().int().min(0).max(365).optional(),
  marketingOptIn: z.boolean().default(true),
});

/** Cuenta destinatarias del filtro. Se usa en vivo mientras se arma la campaña. */
async function audienceQuery(filter: z.infer<typeof audienceSchema>) {
  return sql`
    SELECT u.id, u.email, u.first_name AS "firstName", u.last_name AS "lastName"
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id=u.id
      LEFT JOIN LATERAL (
        SELECT mm.status::text AS status,
               (mm.ends_on - (now() AT TIME ZONE 'America/Santiago')::date)::int AS days_left
          FROM memberships mm WHERE mm.student_id=u.id AND mm.status IN ('active','pending_verification')
         ORDER BY mm.ends_on DESC LIMIT 1) m ON true
     WHERE u.role='student' AND u.status='active'
       AND (${filter.marketingOptIn} = false OR COALESCE(sp.marketing_opt_in, true) = true)
       AND (${filter.membership} = 'todas'
            OR (${filter.membership} = 'active'   AND m.status = 'active')
            OR (${filter.membership} = 'expiring' AND m.status = 'active' AND m.days_left <= 7)
            OR (${filter.membership} = 'expired'  AND m.status IS NULL
                AND EXISTS (SELECT 1 FROM memberships x WHERE x.student_id=u.id))
            OR (${filter.membership} = 'none'     AND m.status IS NULL))
       AND (${filter.inactiveDays ?? null}::int IS NULL OR NOT EXISTS (
             SELECT 1 FROM reservations r JOIN class_sessions s ON s.id=r.session_id
              WHERE r.student_id=u.id AND r.status='attended'
                AND s.starts_at > now() - (${filter.inactiveDays ?? 0}::int || ' days')::interval))
     ORDER BY u.first_name`;
}

adminRouter.post("/campaigns/preview-audience", owner, wrap(async (req, res) => {
  const filter = audienceSchema.parse(req.body ?? {});
  const rows = rowsOf(await db.execute(await audienceQuery(filter)));
  res.json({ data: { total: rows.length, muestra: rows.slice(0, 8) } });
}));

adminRouter.get("/campaigns", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, name, subject, status::text AS status, recipients_count AS "recipientsCount",
           sent_at AS "sentAt", created_at AS "createdAt", audience_filter AS "audienceFilter"
      FROM email_campaigns ORDER BY created_at DESC`));
  res.json({ data: rows });
}));

adminRouter.post("/campaigns", owner, wrap(async (req, res) => {
  const input = z.object({
    name: z.string().min(3),
    subject: z.string().min(3),
    htmlBody: z.string().min(10),
    audience: audienceSchema.default({ membership: "todas", marketingOptIn: true }),
    enviar: z.boolean().default(false),
  }).parse(req.body);

  const destinatarias = rowsOf<{ id: string; email: string; firstName: string }>(
    await db.execute(await audienceQuery(input.audience)),
  );

  const c = await one<{ id: string }>(sql`
    INSERT INTO email_campaigns (name, subject, html_body, audience_filter, status, recipients_count, created_by, sent_at)
    VALUES (${input.name}, ${input.subject}, ${input.htmlBody}, ${JSON.stringify(input.audience)}::jsonb,
            ${input.enviar ? "sent" : "draft"}::campaign_status, ${destinatarias.length},
            ${req.user!.id}::uuid, ${input.enviar ? sql`now()` : sql`NULL`})
    RETURNING id`);

  if (input.enviar) {
    // Se encola, no se envía: el envío real lo hace el job del outbox.
    for (const d of destinatarias) {
      await db.execute(sql`
        INSERT INTO email_outbox (to_email, to_user_id, subject, html_body, campaign_id, dedupe_key)
        VALUES (${d.email}, ${d.id}::uuid, ${input.subject},
                ${input.htmlBody.replace(/\{\{\s*nombre\s*\}\}/g, d.firstName)},
                ${c.id}::uuid, ${`campaign:${c.id}:${d.id}`})
        ON CONFLICT (dedupe_key) DO NOTHING`);
    }
  }

  res.status(201).json({ data: { campaignId: c.id, destinatarias: destinatarias.length, enviada: input.enviar } });
}));

adminRouter.get("/outbox", owner, wrap(async (req, res) => {
  const estado = (req.query.estado as string | undefined) || null;
  const rows = rowsOf(await db.execute(sql`
    SELECT id, to_email AS "toEmail", subject, status::text AS status, template_key AS "templateKey",
           campaign_id AS "campaignId", attempts, last_error AS "lastError",
           created_at AS "createdAt", sent_at AS "sentAt"
      FROM email_outbox
     WHERE (${estado}::text IS NULL OR status::text = ${estado}::text)
     ORDER BY id DESC LIMIT 200`));
  const resumen = await one(sql`
    SELECT count(*) FILTER (WHERE status='queued')::int AS "enCola",
           count(*) FILTER (WHERE status='sent')::int AS enviados,
           count(*) FILTER (WHERE status='failed')::int AS fallidos
      FROM email_outbox`);
  res.json({ data: { correos: rows, resumen } });
}));

/* ------------------------- Configuración y auditoría ------------------------- */

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

adminRouter.get("/audit", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT a.id, a.action, a.entity_type AS "entityType", a.summary, a.created_at AS "createdAt",
           COALESCE(u.first_name || ' ' || u.last_name, 'Sistema') AS actor
      FROM audit_log a LEFT JOIN users u ON u.id=a.actor_user_id
     ORDER BY a.created_at DESC LIMIT 100`));
  res.json({ data: rows });
}));

adminRouter.get("/leads", owner, wrap(async (_req, res) => {
  const rows = rowsOf(await db.execute(sql`
    SELECT id, name, email, phone, message, interest, status::text AS status, created_at AS "createdAt"
      FROM contact_leads ORDER BY created_at DESC LIMIT 100`));
  res.json({ data: rows });
}));
