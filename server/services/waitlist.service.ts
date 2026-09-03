import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { bookSpot } from "../sql/bookSpot.sql";
import { findEligibleMembership } from "./booking.service";
import { queueTemplate } from "./email.service";
import { getSettings } from "./settings.service";

/**
 * Promueve a la primera de la lista cuando se libera un cupo.
 *
 * Es event-driven a propósito: en Vercel Hobby el cron corre una vez al día, así
 * que esperar a un job dejaría los cupos liberados sin aprovechar durante horas.
 * Se llama directamente desde el handler de cancelación.
 *
 * Recorre la fila hasta encontrar a alguien que efectivamente pueda tomar el
 * cupo: quien ya no tiene créditos o cuyo plan no cubre ese horario se marca
 * `expired` con el motivo y se pasa a la siguiente.
 */
export async function promoteFromWaitlist(sessionId: string, maxAttempts = 5): Promise<string | null> {
  const settings = await getSettings();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await db.execute(sql`
      SELECT w.id, w.student_id, w.auto_book,
             s.class_type_id, s.local_date::text AS local_date, s.start_time::text AS start_time,
             s.booked_count, s.capacity, s.starts_at,
             u.email, u.first_name,
             ct.name AS class_name
        FROM waitlist_entries w
        JOIN class_sessions s ON s.id = w.session_id
        JOIN users u ON u.id = w.student_id
        JOIN class_types ct ON ct.id = s.class_type_id
       WHERE w.session_id = ${sessionId}::uuid
         AND w.status = 'waiting'
         AND s.status = 'scheduled'
         AND s.booked_count < s.capacity
         AND s.starts_at > now() + (${settings.booking_closes_minutes_before}::int || ' minutes')::interval
       ORDER BY w.created_at ASC
       LIMIT 1
    `);

    const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as Array<{
      id: string;
      student_id: string;
      auto_book: boolean;
      class_type_id: string;
      local_date: string;
      start_time: string;
      class_name: string;
      email: string;
      first_name: string;
    }>;

    if (!rows.length) return null;
    const entry = rows[0];

    if (!entry.auto_book) {
      await db.execute(sql`
        UPDATE waitlist_entries
           SET status = 'offered',
               offered_at = now(),
               offer_expires_at = now() + (${settings.waitlist_offer_minutes}::int || ' minutes')::interval,
               notified_at = now()
         WHERE id = ${entry.id}::uuid
      `);
      await queueTemplate("waitlist_promoted", entry.student_id, entry.email, {
        nombre: entry.first_name,
        clase: entry.class_name,
        fecha: entry.local_date,
        hora: entry.start_time.slice(0, 5),
        minutos: settings.waitlist_offer_minutes,
      });
      return entry.id;
    }

    const membership = await findEligibleMembership(entry.student_id, {
      id: sessionId,
      classTypeId: entry.class_type_id,
      localDate: entry.local_date,
      startTime: entry.start_time,
    });

    if (!membership) {
      await db.execute(sql`
        UPDATE waitlist_entries
           SET status = 'expired', expired_reason = 'Sin plan vigente que cubra esta clase'
         WHERE id = ${entry.id}::uuid
      `);
      continue;
    }

    const booked = await bookSpot({
      sessionId,
      studentId: entry.student_id,
      membershipId: membership.id,
      closeMinutesBefore: settings.booking_closes_minutes_before,
      source: "waitlist",
    });

    if (!booked) {
      // El cupo se fue entre la consulta y la reserva. No es un error.
      return null;
    }

    await db.execute(sql`
      UPDATE waitlist_entries
         SET status = 'promoted', promoted_at = now(), reservation_id = ${booked.reservationId}::uuid
       WHERE id = ${entry.id}::uuid
    `);
    await db.execute(sql`
      UPDATE class_sessions
         SET waitlist_count = GREATEST(0, waitlist_count - 1)
       WHERE id = ${sessionId}::uuid
    `);

    await queueTemplate("waitlist_promoted", entry.student_id, entry.email, {
      nombre: entry.first_name,
      clase: entry.class_name,
      fecha: entry.local_date,
      hora: entry.start_time.slice(0, 5),
    });

    return booked.reservationId;
  }

  return null;
}

export async function joinWaitlist(sessionId: string, studentId: string) {
  const result = await db.execute(sql`
    WITH ins AS (
      INSERT INTO waitlist_entries (session_id, student_id)
      SELECT ${sessionId}::uuid, ${studentId}::uuid
        FROM class_sessions s
       WHERE s.id = ${sessionId}::uuid
         AND s.status = 'scheduled'
         AND s.booked_count >= s.capacity
      ON CONFLICT (session_id, student_id) WHERE status IN ('waiting','offered') DO NOTHING
      RETURNING id
    ),
    bump AS (
      UPDATE class_sessions
         SET waitlist_count = waitlist_count + 1
       WHERE id = ${sessionId}::uuid AND EXISTS (SELECT 1 FROM ins)
      RETURNING id
    )
    SELECT id FROM ins
  `);

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { id: string }[];
  return rows[0]?.id ?? null;
}

export async function leaveWaitlist(sessionId: string, studentId: string) {
  const result = await db.execute(sql`
    WITH gone AS (
      UPDATE waitlist_entries
         SET status = 'cancelled'
       WHERE session_id = ${sessionId}::uuid
         AND student_id = ${studentId}::uuid
         AND status IN ('waiting','offered')
      RETURNING id
    ),
    bump AS (
      UPDATE class_sessions
         SET waitlist_count = GREATEST(0, waitlist_count - 1)
       WHERE id = ${sessionId}::uuid AND EXISTS (SELECT 1 FROM gone)
      RETURNING id
    )
    SELECT count(*)::int AS n FROM gone
  `);
  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { n: number }[];
  return (rows[0]?.n ?? 0) > 0;
}

/** Posición en la fila, para mostrarla en el portal de la alumna. */
export async function waitlistPosition(sessionId: string, studentId: string): Promise<number | null> {
  const result = await db.execute(sql`
    SELECT position FROM (
      SELECT student_id, row_number() OVER (ORDER BY created_at ASC)::int AS position
        FROM waitlist_entries
       WHERE session_id = ${sessionId}::uuid AND status = 'waiting'
    ) q WHERE student_id = ${studentId}::uuid
  `);
  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { position: number }[];
  return rows[0]?.position ?? null;
}
