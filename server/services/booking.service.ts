import { and, eq, sql } from "drizzle-orm";
import { DomainError, fail } from "@shared/domain/errors";
import { hhmm, weekdayName } from "@shared/domain/time";
import { classSessions, classTypes, memberships, plans, reservations } from "@shared/schema";
import { db } from "../db/client";
import { bookSpot, forfeitCredit, refundCredit, releaseSpot } from "../sql/bookSpot.sql";
import { getSettings } from "./settings.service";

export type EligibleMembership = {
  id: string;
  planId: string;
  planName: string;
  creditsRemaining: number;
  endsOn: string;
  segment: string;
};

/**
 * Elige con qué membresía pagar la clase.
 *
 * Reglas, en orden:
 *  - vigente y con créditos disponibles;
 *  - que cubra ese tipo de clase (plan_class_types vacío = cubre todos);
 *  - que permita ese día y esa hora (los planes valle sólo sirven lun–vie 15–17h);
 *  - de las que quedan, la que vence antes: se consume primero lo que caduca.
 */
export async function findEligibleMembership(
  studentId: string,
  session: { id: string; classTypeId: string; localDate: string; startTime: string },
): Promise<EligibleMembership | null> {
  const result = await db.execute(sql`
    SELECT m.id,
           m.plan_id,
           p.name AS plan_name,
           p.segment::text AS segment,
           (m.credits_total - m.credits_used) AS credits_remaining,
           m.ends_on::text AS ends_on
      FROM memberships m
      JOIN plans p ON p.id = m.plan_id
     WHERE m.student_id = ${studentId}::uuid
       AND m.status = 'active'
       AND m.ends_on >= (now() AT TIME ZONE 'America/Santiago')::date
       AND m.credits_used < m.credits_total
       AND (
         NOT EXISTS (SELECT 1 FROM plan_class_types pct WHERE pct.plan_id = p.id)
         OR EXISTS (
           SELECT 1 FROM plan_class_types pct
            WHERE pct.plan_id = p.id AND pct.class_type_id = ${session.classTypeId}::uuid
         )
       )
       AND (p.allowed_weekdays IS NULL
            OR EXTRACT(DOW FROM ${session.localDate}::date)::smallint = ANY(p.allowed_weekdays))
       AND (p.allowed_time_from IS NULL OR ${session.startTime}::time >= p.allowed_time_from)
       AND (p.allowed_time_to   IS NULL OR ${session.startTime}::time <= p.allowed_time_to)
     ORDER BY m.ends_on ASC, credits_remaining ASC
     LIMIT 1
  `);

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as Array<{
    id: string;
    plan_id: string;
    plan_name: string;
    segment: string;
    credits_remaining: number;
    ends_on: string;
  }>;

  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    planId: r.plan_id,
    planName: r.plan_name,
    segment: r.segment,
    creditsRemaining: Number(r.credits_remaining),
    endsOn: r.ends_on,
  };
}

/**
 * Cuando no hay membresía elegible hay que decir POR QUÉ. "No puedes reservar"
 * sin explicación es la peor experiencia posible: la alumna no sabe si le
 * faltan créditos, si su plan venció o si es el horario equivocado.
 */
async function explainIneligibility(
  studentId: string,
  session: { classTypeId: string; localDate: string; startTime: string },
): Promise<never> {
  const result = await db.execute(sql`
    SELECT p.name,
           p.segment::text AS segment,
           (m.credits_total - m.credits_used) AS credits_remaining,
           m.ends_on::text AS ends_on,
           m.status::text AS status,
           p.allowed_weekdays,
           p.allowed_time_from::text AS allowed_time_from,
           p.allowed_time_to::text AS allowed_time_to,
           (NOT EXISTS (SELECT 1 FROM plan_class_types pct WHERE pct.plan_id = p.id)
            OR EXISTS (SELECT 1 FROM plan_class_types pct
                        WHERE pct.plan_id = p.id AND pct.class_type_id = ${session.classTypeId}::uuid)
           ) AS covers_class
      FROM memberships m
      JOIN plans p ON p.id = m.plan_id
     WHERE m.student_id = ${studentId}::uuid
       AND m.status IN ('active','pending_verification')
     ORDER BY m.ends_on DESC
  `);

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as Array<{
    name: string;
    segment: string;
    credits_remaining: number;
    ends_on: string;
    status: string;
    allowed_weekdays: number[] | null;
    allowed_time_from: string | null;
    allowed_time_to: string | null;
    covers_class: boolean;
  }>;

  if (!rows.length) {
    fail("NO_ACTIVE_PLAN", "No tienes un plan activo. Compra uno o reserva esta clase suelta.");
  }

  const pending = rows.find((r) => r.status === "pending_verification");
  if (pending) {
    fail(
      "NO_ACTIVE_PLAN",
      `Tu plan ${pending.name} está esperando que verifiquemos tu certificado de alumno regular.`,
    );
  }

  const withCredits = rows.filter((r) => Number(r.credits_remaining) > 0);
  if (!withCredits.length) {
    fail("NO_CREDITS", "Te quedaste sin créditos. Renueva tu plan para seguir reservando.");
  }

  const timeRestricted = withCredits.find((r) => r.allowed_weekdays !== null || r.allowed_time_from !== null);
  if (timeRestricted) {
    const dias = (timeRestricted.allowed_weekdays ?? []).map(weekdayName).join(", ");
    const desde = timeRestricted.allowed_time_from ? hhmm(timeRestricted.allowed_time_from) : null;
    const hasta = timeRestricted.allowed_time_to ? hhmm(timeRestricted.allowed_time_to) : null;
    const franja = desde && hasta ? ` entre las ${desde} y las ${hasta}` : "";
    fail(
      "PLAN_TIME_RESTRICTED",
      `Tu plan ${timeRestricted.name} sólo permite reservar los ${dias}${franja}. Esta clase queda fuera de tu horario.`,
    );
  }

  const notCovering = withCredits.find((r) => !r.covers_class);
  if (notCovering) {
    fail("PLAN_NOT_APPLICABLE", `Tu plan ${notCovering.name} no incluye este tipo de clase.`);
  }

  throw new DomainError("NO_ACTIVE_PLAN", "Ninguno de tus planes cubre esta clase.");
}

export async function getSessionForBooking(sessionId: string) {
  const [row] = await db
    .select({
      id: classSessions.id,
      classTypeId: classSessions.classTypeId,
      className: classTypes.name,
      localDate: classSessions.localDate,
      startTime: classSessions.startTime,
      startsAt: classSessions.startsAt,
      capacity: classSessions.capacity,
      bookedCount: classSessions.bookedCount,
      status: classSessions.status,
    })
    .from(classSessions)
    .innerJoin(classTypes, eq(classTypes.id, classSessions.classTypeId))
    .where(eq(classSessions.id, sessionId))
    .limit(1);

  if (!row) fail("NOT_FOUND", "Esa clase no existe.");
  return row;
}

export async function createBooking(studentId: string, sessionId: string, source: "web" | "admin" = "web") {
  const settings = await getSettings();
  const session = await getSessionForBooking(sessionId);

  if (session.status === "cancelled") fail("SESSION_CANCELLED", "Esa clase fue cancelada.");
  if (session.startsAt.getTime() <= Date.now() + settings.booking_closes_minutes_before * 60_000) {
    fail("SESSION_CLOSED", `La reserva se cierra ${settings.booking_closes_minutes_before} minutos antes de la clase.`);
  }

  // Límite diario: se comprueba antes para dar un mensaje claro, y el índice
  // único uq_reservation_active cubre el caso de la doble reserva exacta.
  const dayCount = await db.execute(sql`
    SELECT count(*)::int AS n
      FROM reservations r
      JOIN class_sessions s ON s.id = r.session_id
     WHERE r.student_id = ${studentId}::uuid
       AND s.local_date = ${session.localDate}::date
       AND r.status IN ('booked','attended')
  `);
  const dayRows = (Array.isArray(dayCount) ? dayCount : (dayCount as { rows: unknown[] }).rows) as { n: number }[];

  const membership = await findEligibleMembership(studentId, session);
  if (!membership) await explainIneligibility(studentId, session);

  const [plan] = await db.select({ maxPerDay: plans.maxBookingsPerDay }).from(plans).where(eq(plans.id, membership!.planId)).limit(1);
  if (plan && (dayRows[0]?.n ?? 0) >= plan.maxPerDay) {
    fail("DAILY_LIMIT", `Tu plan permite ${plan.maxPerDay} clase(s) por día.`);
  }

  if (session.bookedCount >= session.capacity) {
    fail("SESSION_FULL", "La clase está llena. Puedes entrar a la lista de espera.");
  }

  const booked = await bookSpot({
    sessionId,
    studentId,
    membershipId: membership!.id,
    closeMinutesBefore: settings.booking_closes_minutes_before,
    source,
  });

  // Sin filas = perdió la carrera por el último cupo, o la clase acaba de
  // cerrarse. Se re-consulta para dar el motivo exacto.
  if (!booked) {
    const fresh = await getSessionForBooking(sessionId);
    if (fresh.bookedCount >= fresh.capacity) {
      fail("SESSION_FULL", "Alguien tomó el último cupo justo antes que tú. Puedes entrar a la lista de espera.");
    }
    if (fresh.status === "cancelled") fail("SESSION_CANCELLED", "Esa clase fue cancelada.");
    fail("CONFLICT", "No se pudo completar la reserva. Vuelve a intentarlo.");
  }

  return {
    reservationId: booked!.reservationId,
    creditsRemaining: booked!.creditsRemaining,
    membership: membership!,
    session,
  };
}

export type CancelOutcome = {
  refunded: boolean;
  wasLate: boolean;
  message: string;
};

export async function cancelBooking(
  reservationId: string,
  actorId: string,
  opts: { waivePenalty?: boolean; asStudio?: boolean } = {},
): Promise<CancelOutcome> {
  const settings = await getSettings();

  const [row] = await db
    .select({
      id: reservations.id,
      studentId: reservations.studentId,
      membershipId: reservations.membershipId,
      creditCharged: reservations.creditCharged,
      status: reservations.status,
      startsAt: classSessions.startsAt,
      sessionId: classSessions.id,
    })
    .from(reservations)
    .innerJoin(classSessions, eq(classSessions.id, reservations.sessionId))
    .where(eq(reservations.id, reservationId))
    .limit(1);

  if (!row) fail("NOT_FOUND", "Esa reserva no existe.");
  if (row.status !== "booked") fail("CONFLICT", "Esa reserva ya no está activa.");

  const hoursToStart = (row.startsAt.getTime() - Date.now()) / 3_600_000;
  const alreadyStarted = hoursToStart <= 0;
  const isLate = hoursToStart < settings.late_cancel_hours;

  if (alreadyStarted && !opts.asStudio && !opts.waivePenalty) {
    fail("TOO_LATE_TO_CANCEL", "La clase ya empezó. Escríbenos si necesitas ayuda.");
  }

  const newStatus = opts.asStudio ? "studio_cancelled" : isLate && !opts.waivePenalty ? "late_cancelled" : "cancelled";

  const released = await releaseSpot({ reservationId, newStatus, cancelledBy: actorId });
  if (!released) fail("CONFLICT", "Esa reserva ya fue cancelada.");

  let refunded = false;
  if (released!.creditCharged && released!.membershipId) {
    if (opts.asStudio) {
      refunded = await refundCredit({
        reservationId,
        membershipId: released!.membershipId,
        studentId: row.studentId,
        reason: "studio_cancel_refund",
        note: "Clase cancelada por el estudio",
      });
    } else if (!isLate || opts.waivePenalty) {
      refunded = await refundCredit({
        reservationId,
        membershipId: released!.membershipId,
        studentId: row.studentId,
        reason: "cancellation_refund",
        note: opts.waivePenalty ? "Cancelación tardía perdonada por el estudio" : undefined,
      });
    } else {
      await forfeitCredit({
        reservationId,
        membershipId: released!.membershipId,
        studentId: row.studentId,
        reason: "late_cancel_forfeit",
        note: `Cancelada a ${hoursToStart.toFixed(1)} h del inicio`,
      });
    }
  }

  const message = opts.asStudio
    ? "Clase cancelada por el estudio. Te devolvimos el crédito."
    : refunded
      ? "Reserva cancelada. Te devolvimos el crédito."
      : `Reserva cancelada. Como faltaban menos de ${settings.late_cancel_hours} horas, el crédito no se devuelve.`;

  return { refunded, wasLate: isLate, message };
}

/** Se usa tras liberar un cupo. Definida aquí para evitar dependencia circular. */
export { releaseSpot };
