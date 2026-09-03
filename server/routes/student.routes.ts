import { Router } from "express";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client";
import { wrap } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/requireRole";
import { cancelBooking, createBooking, findEligibleMembership, getSessionForBooking } from "../services/booking.service";
import { queueTemplate } from "../services/email.service";
import { joinWaitlist, leaveWaitlist, promoteFromWaitlist, waitlistPosition } from "../services/waitlist.service";

export const studentRouter = Router();

const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];

studentRouter.get(
  "/me/dashboard",
  requireAuth,
  wrap(async (req, res) => {
    const uid = req.user!.id;

    const memberships = rowsOf(
      await db.execute(sql`
        SELECT m.id, p.name AS "planName", p.segment::text AS segment,
               m.credits_total AS "creditsTotal", m.credits_used AS "creditsUsed",
               (m.credits_total - m.credits_used) AS "creditsRemaining",
               m.ends_on::text AS "endsOn", m.status::text AS status,
               (m.ends_on - (now() AT TIME ZONE 'America/Santiago')::date)::int AS "daysLeft",
               p.allowed_weekdays AS "allowedWeekdays",
               p.allowed_time_from::text AS "allowedTimeFrom",
               p.allowed_time_to::text AS "allowedTimeTo"
          FROM memberships m JOIN plans p ON p.id = m.plan_id
         WHERE m.student_id = ${uid}::uuid AND m.status IN ('active','pending_verification')
         ORDER BY m.ends_on ASC
      `),
    );

    const upcoming = rowsOf(
      await db.execute(sql`
        SELECT r.id, r.status::text AS status,
               s.id AS "sessionId", s.local_date::text AS "localDate",
               s.start_time::text AS "startTime", s.starts_at AS "startsAt",
               ct.name AS "className",
               COALESCE(i.first_name, 'Por confirmar') AS "instructorName",
               rm.name AS "roomName"
          FROM reservations r
          JOIN class_sessions s ON s.id = r.session_id
          JOIN class_types ct ON ct.id = s.class_type_id
          JOIN rooms rm ON rm.id = s.room_id
          LEFT JOIN users i ON i.id = s.instructor_id
         WHERE r.student_id = ${uid}::uuid AND r.status = 'booked' AND s.starts_at > now()
         ORDER BY s.starts_at ASC LIMIT 5
      `),
    );

    const waiting = rowsOf(
      await db.execute(sql`
        SELECT w.id, w.status::text AS status, s.id AS "sessionId",
               s.local_date::text AS "localDate", s.start_time::text AS "startTime",
               ct.name AS "className"
          FROM waitlist_entries w
          JOIN class_sessions s ON s.id = w.session_id
          JOIN class_types ct ON ct.id = s.class_type_id
         WHERE w.student_id = ${uid}::uuid AND w.status IN ('waiting','offered') AND s.starts_at > now()
         ORDER BY s.starts_at ASC
      `),
    );

    res.json({ data: { memberships, upcoming, waitlist: waiting } });
  }),
);

studentRouter.get(
  "/me/memberships",
  requireAuth,
  wrap(async (req, res) => {
    const rows = rowsOf(
      await db.execute(sql`
        SELECT m.id, p.name AS "planName", p.segment::text AS segment, p.credits AS "planCredits",
               m.credits_total AS "creditsTotal", m.credits_used AS "creditsUsed",
               (m.credits_total - m.credits_used) AS "creditsRemaining",
               m.starts_on::text AS "startsOn", m.ends_on::text AS "endsOn",
               m.status::text AS status, m.price_paid_clp AS "pricePaidClp"
          FROM memberships m JOIN plans p ON p.id = m.plan_id
         WHERE m.student_id = ${req.user!.id}::uuid
         ORDER BY m.starts_on DESC
      `),
    );
    res.json({ data: rows });
  }),
);

/** Libro mayor de créditos, en lenguaje entendible. */
studentRouter.get(
  "/me/credits",
  requireAuth,
  wrap(async (req, res) => {
    const rows = rowsOf(
      await db.execute(sql`
        SELECT ct.id, ct.delta, ct.reason::text AS reason, ct.note,
               ct.created_at AS "createdAt", ct.balance_after AS "balanceAfter",
               cls.name AS "className", s.local_date::text AS "localDate", s.start_time::text AS "startTime"
          FROM credit_transactions ct
          LEFT JOIN reservations r ON r.id = ct.reservation_id
          LEFT JOIN class_sessions s ON s.id = r.session_id
          LEFT JOIN class_types cls ON cls.id = s.class_type_id
         WHERE ct.student_id = ${req.user!.id}::uuid
         ORDER BY ct.created_at DESC LIMIT 100
      `),
    );
    res.json({ data: rows });
  }),
);

studentRouter.get(
  "/me/reservations",
  requireAuth,
  wrap(async (req, res) => {
    const scope = req.query.scope === "past" ? "past" : "upcoming";
    const rows = rowsOf(
      await db.execute(sql`
        SELECT r.id, r.status::text AS status, r.booked_at AS "bookedAt",
               r.checked_in_at AS "checkedInAt", r.credit_charged AS "creditCharged",
               s.id AS "sessionId", s.local_date::text AS "localDate",
               s.start_time::text AS "startTime", s.starts_at AS "startsAt",
               ct.name AS "className",
               COALESCE(i.first_name, 'Por confirmar') AS "instructorName",
               rm.name AS "roomName",
               EXTRACT(EPOCH FROM (s.starts_at - now()))/3600 AS "hoursToStart"
          FROM reservations r
          JOIN class_sessions s ON s.id = r.session_id
          JOIN class_types ct ON ct.id = s.class_type_id
          JOIN rooms rm ON rm.id = s.room_id
          LEFT JOIN users i ON i.id = s.instructor_id
         WHERE r.student_id = ${req.user!.id}::uuid
           AND (${scope} = 'upcoming' AND s.starts_at > now() AND r.status = 'booked'
                OR ${scope} = 'past' AND (s.starts_at <= now() OR r.status <> 'booked'))
         ORDER BY s.starts_at ${scope === "past" ? sql`DESC` : sql`ASC`}
         LIMIT 100
      `),
    );
    res.json({ data: rows });
  }),
);

const bookingSchema = z.object({ sessionId: z.string().uuid() });

studentRouter.post(
  "/bookings",
  requireAuth,
  wrap(async (req, res) => {
    const { sessionId } = bookingSchema.parse(req.body);
    const result = await createBooking(req.user!.id, sessionId);

    await queueTemplate("booking_confirmed", req.user!.id, req.user!.email, {
      nombre: req.user!.firstName,
      clase: result.session.className,
      fecha: result.session.localDate,
      hora: result.session.startTime.slice(0, 5),
      creditos: result.creditsRemaining,
    });

    res.status(201).json({
      data: {
        reservationId: result.reservationId,
        creditsRemaining: result.creditsRemaining,
        plan: result.membership.planName,
        message: `Reservaste ${result.session.className}. Te quedan ${result.creditsRemaining} créditos.`,
      },
    });
  }),
);

studentRouter.delete(
  "/bookings/:id",
  requireAuth,
  wrap(async (req, res) => {
    const [own] = rowsOf<{ student_id: string; session_id: string }>(
      await db.execute(sql`SELECT student_id, session_id FROM reservations WHERE id = ${req.params.id}::uuid`),
    );
    if (!own || own.student_id !== req.user!.id) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Esa reserva no existe." } });
    }

    const outcome = await cancelBooking(req.params.id, req.user!.id);
    // Se promueve en el acto: esperar al cron dejaría el cupo perdido por horas.
    const promoted = await promoteFromWaitlist(own.session_id);

    await queueTemplate("booking_cancelled", req.user!.id, req.user!.email, {
      nombre: req.user!.firstName,
      devuelto: outcome.refunded ? "sí" : "no",
    });

    res.json({ data: { ...outcome, waitlistPromoted: Boolean(promoted) } });
  }),
);

studentRouter.post(
  "/sessions/:id/waitlist",
  requireAuth,
  wrap(async (req, res) => {
    const session = await getSessionForBooking(req.params.id);
    if (session.bookedCount < session.capacity) {
      return res.status(409).json({
        error: { code: "CONFLICT", message: "Todavía quedan cupos: reserva directamente." },
      });
    }

    // Se avisa temprano si no podrá tomar el cupo cuando le toque.
    const membership = await findEligibleMembership(req.user!.id, session);
    const entryId = await joinWaitlist(req.params.id, req.user!.id);
    if (!entryId) {
      return res.status(409).json({ error: { code: "CONFLICT", message: "Ya estás en la lista de espera." } });
    }

    const position = await waitlistPosition(req.params.id, req.user!.id);
    res.status(201).json({
      data: {
        position,
        warning: membership ? null : "Estás en la lista, pero necesitarás créditos vigentes para tomar el cupo.",
      },
    });
  }),
);

studentRouter.delete(
  "/sessions/:id/waitlist",
  requireAuth,
  wrap(async (req, res) => {
    const left = await leaveWaitlist(req.params.id, req.user!.id);
    if (!left) return res.status(404).json({ error: { code: "NOT_ON_WAITLIST", message: "No estabas en la lista." } });
    res.json({ data: { ok: true } });
  }),
);
