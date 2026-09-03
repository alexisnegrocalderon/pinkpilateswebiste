import { sql } from "drizzle-orm";
import { db } from "../db/client";

export type BookSpotResult = { reservationId: string; creditsRemaining: number | null } | null;

/**
 * Reserva un cupo consumiendo un crédito, en UNA sola sentencia.
 *
 * Por qué una sola sentencia y no una transacción con SELECT ... FOR UPDATE:
 * el driver HTTP de Neon no soporta transacciones interactivas. Pero además,
 * ni siquiera hace falta — esto es más simple y más rápido.
 *
 * Cómo resuelve la carrera por el último cupo:
 *   1. `UPDATE class_sessions ... WHERE booked_count < capacity` toma un row
 *      lock sobre la clase.
 *   2. Si dos alumnas llegan a la vez, la segunda se bloquea. Al liberarse el
 *      lock, Postgres RE-EVALÚA el WHERE contra la fila ya actualizada
 *      (EvalPlanQual), ve que booked_count ya alcanzó capacity, y actualiza
 *      cero filas.
 *   3. Los CTE siguientes están condicionados con `EXISTS (SELECT 1 FROM sess)`,
 *      así que sin cupo no se inserta reserva NI se descuenta el crédito.
 *   4. La función devuelve null y la ruta responde 409 SESSION_FULL.
 *
 * Las redes de seguridad en la base (`ck_session_booked_within_capacity` y
 * `ck_membership_credits`) hacen imposible el overbooking incluso si alguien
 * escribiera por fuera de este código.
 */
export async function bookSpot(params: {
  sessionId: string;
  studentId: string;
  membershipId: string;
  closeMinutesBefore: number;
  source?: "web" | "admin" | "waitlist";
}): Promise<BookSpotResult> {
  const { sessionId, studentId, membershipId, closeMinutesBefore, source = "web" } = params;

  const result = await db.execute(sql`
    WITH sess AS (
      UPDATE class_sessions
         SET booked_count = booked_count + 1,
             updated_at = now()
       WHERE id = ${sessionId}::uuid
         AND status = 'scheduled'
         AND booked_count < capacity
         AND starts_at > now() + (${closeMinutesBefore}::int || ' minutes')::interval
      RETURNING id
    ),
    mem AS (
      UPDATE memberships
         SET credits_used = credits_used + 1,
             updated_at = now()
       WHERE id = ${membershipId}::uuid
         AND status = 'active'
         AND ends_on >= (now() AT TIME ZONE 'America/Santiago')::date
         AND credits_used < credits_total
         AND EXISTS (SELECT 1 FROM sess)
      RETURNING id, credits_total, credits_used
    ),
    res AS (
      INSERT INTO reservations (session_id, student_id, membership_id, status, source, credit_charged)
      SELECT ${sessionId}::uuid, ${studentId}::uuid, ${membershipId}::uuid, 'booked', ${source}::reservation_source, true
      WHERE EXISTS (SELECT 1 FROM sess) AND EXISTS (SELECT 1 FROM mem)
      RETURNING id
    ),
    ledger AS (
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, reservation_id, balance_after)
      SELECT ${membershipId}::uuid, ${studentId}::uuid, -1, 'booking', res.id,
             mem.credits_total - mem.credits_used
      FROM res CROSS JOIN mem
      RETURNING reservation_id
    )
    SELECT res.id AS reservation_id,
           (SELECT credits_total - credits_used FROM mem) AS credits_remaining
      FROM res
  `);

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as {
    reservation_id: string;
    credits_remaining: number | null;
  }[];

  if (!rows.length) return null;
  return {
    reservationId: rows[0].reservation_id,
    creditsRemaining: rows[0].credits_remaining === null ? null : Number(rows[0].credits_remaining),
  };
}

/**
 * Libera el cupo al cancelar. También es una sola sentencia condicionada:
 * `WHERE status = 'booked'` evita que un doble click decremente dos veces.
 */
export async function releaseSpot(params: {
  reservationId: string;
  newStatus: "cancelled" | "late_cancelled" | "studio_cancelled";
  cancelledBy: string | null;
}): Promise<{ sessionId: string; membershipId: string | null; creditCharged: boolean } | null> {
  const { reservationId, newStatus, cancelledBy } = params;

  const result = await db.execute(sql`
    WITH res AS (
      UPDATE reservations
         SET status = ${newStatus}::reservation_status,
             cancelled_at = now(),
             cancelled_by = ${cancelledBy}::uuid,
             updated_at = now()
       WHERE id = ${reservationId}::uuid
         AND status = 'booked'
      RETURNING id, session_id, membership_id, credit_charged
    ),
    freed AS (
      UPDATE class_sessions
         SET booked_count = GREATEST(0, booked_count - 1),
             updated_at = now()
       WHERE id = (SELECT session_id FROM res)
      RETURNING id
    )
    SELECT session_id, membership_id, credit_charged FROM res
  `);

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as {
    session_id: string;
    membership_id: string | null;
    credit_charged: boolean;
  }[];

  if (!rows.length) return null;
  return {
    sessionId: rows[0].session_id,
    membershipId: rows[0].membership_id,
    creditCharged: rows[0].credit_charged,
  };
}

/**
 * Devuelve el crédito. Idempotente por el índice único
 * `uq_credit_tx_idem(reservation_id, reason)`: si ya se devolvió, el INSERT no
 * hace nada y el UPDATE tampoco se ejecuta.
 */
export async function refundCredit(params: {
  reservationId: string;
  membershipId: string;
  studentId: string;
  reason: "cancellation_refund" | "studio_cancel_refund";
  note?: string;
}): Promise<boolean> {
  const { reservationId, membershipId, studentId, reason, note } = params;

  const result = await db.execute(sql`
    WITH tx AS (
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, reservation_id, note)
      VALUES (${membershipId}::uuid, ${studentId}::uuid, 1, ${reason}::credit_reason,
              ${reservationId}::uuid, ${note ?? null})
      ON CONFLICT (reservation_id, reason) WHERE reservation_id IS NOT NULL DO NOTHING
      RETURNING id
    ),
    restored AS (
      UPDATE memberships
         SET credits_used = GREATEST(0, credits_used - 1),
             status = CASE WHEN status = 'depleted' THEN 'active' ELSE status END,
             updated_at = now()
       WHERE id = ${membershipId}::uuid
         AND EXISTS (SELECT 1 FROM tx)
      RETURNING id
    )
    SELECT count(*)::int AS refunded FROM restored
  `);

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { refunded: number }[];
  return (rows[0]?.refunded ?? 0) > 0;
}

/** Marca la pérdida del crédito sin moverlo: ya fue descontado al reservar. */
export async function forfeitCredit(params: {
  reservationId: string;
  membershipId: string;
  studentId: string;
  reason: "late_cancel_forfeit" | "no_show_forfeit";
  note?: string;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO credit_transactions (membership_id, student_id, delta, reason, reservation_id, note)
    VALUES (${params.membershipId}::uuid, ${params.studentId}::uuid, 0,
            ${params.reason}::credit_reason, ${params.reservationId}::uuid, ${params.note ?? null})
    ON CONFLICT (reservation_id, reason) WHERE reservation_id IS NOT NULL DO NOTHING
  `);
}
