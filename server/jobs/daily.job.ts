import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { materializeSessions } from "../services/schedule.service";

/**
 * Horas después del término de una clase en que se marca no-show automático.
 * La instructora puede corregirlo a mano desde "Pasar lista" después.
 */
const NO_SHOW_GRACE_HOURS = 2;

export type DailyJobResult = {
  sessionsCreated: number;
  sessionsCompleted: number;
  noShowsMarked: number;
  membershipsExpired: number;
  membershipsDepleted: number;
};

/**
 * Job diario (`/api/jobs/run?job=daily`, disparado por el cron de Vercel).
 *
 * Cada paso es una sola sentencia SQL de conjunto, no un loop — mismo patrón
 * que el resto de `server/services`: más rápido y no hay nada que paginar.
 *
 * Todas las transiciones de aquí son también auto-correctivas en el punto que
 * importa (reservar ya valida `ends_on`/`credits_used` en vivo, ver
 * `findEligibleMembership`), así que este job no es la única red de
 * seguridad — pero sin él el panel y los reportes muestran estado atrasado
 * (una membresía vencida ayer sigue apareciendo "activa").
 */
export async function runDailyJob(): Promise<DailyJobResult> {
  const sessionsCreated = await materializeSessions();
  const sessionsCompleted = await completeEndedSessions();
  const noShowsMarked = await markNoShows();
  const membershipsExpired = await expireMemberships();
  const membershipsDepleted = await depleteMemberships();

  return { sessionsCreated, sessionsCompleted, noShowsMarked, membershipsExpired, membershipsDepleted };
}

async function completeEndedSessions(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE class_sessions
       SET status = 'completed', updated_at = now()
     WHERE status = 'scheduled' AND ends_at < now()
    RETURNING id
  `);
  return rowCount(result);
}

/** El crédito no se devuelve: ya se descontó al reservar (ver `bookSpot`). */
async function markNoShows(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE reservations r
       SET status = 'no_show', updated_at = now()
      FROM class_sessions s
     WHERE r.session_id = s.id
       AND r.status = 'booked'
       AND s.ends_at < now() - (${NO_SHOW_GRACE_HOURS}::int || ' hours')::interval
    RETURNING r.id
  `);
  return rowCount(result);
}

async function expireMemberships(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE memberships
       SET status = 'expired', updated_at = now()
     WHERE status = 'active'
       AND ends_on < (now() AT TIME ZONE 'America/Santiago')::date
    RETURNING id
  `);
  return rowCount(result);
}

/** `refundCredit` ya sabe restaurar desde 'depleted' a 'active' — esta es la mitad que faltaba. */
async function depleteMemberships(): Promise<number> {
  const result = await db.execute(sql`
    UPDATE memberships
       SET status = 'depleted', depleted_at = now(), updated_at = now()
     WHERE status = 'active'
       AND credits_used >= credits_total
    RETURNING id
  `);
  return rowCount(result);
}

function rowCount(result: unknown): number {
  const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows;
  return rows.length;
}
