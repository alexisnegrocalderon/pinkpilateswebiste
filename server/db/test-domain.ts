import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./client";
import { DomainError } from "@shared/domain/errors";
import { cancelBooking, createBooking } from "../services/booking.service";
import { joinWaitlist, promoteFromWaitlist } from "../services/waitlist.service";

const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];
let pass = 0, fail = 0;
const check = (label: string, ok: boolean, detail = "") => {
  console.log(`  ${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  ok ? pass++ : fail++;
};


/**
 * Crea una clase de prueba en una sala dedicada. Mover clases reales del
 * horario para acercarlas en el tiempo hace que choquen entre si contra la
 * restriccion de solape de sala; una sala propia aisla los escenarios.
 */
let testSlot = 0;
async function makeTestSession(hoursFromNow: number, classTypeSlug = "studio-pilates", capacity = 5) {
  // Una sala por sesion. Separarlas por sala en vez de por hora permite que
  // cada escenario use la distancia temporal que realmente necesita probar.
  const roomName = `Sala de pruebas ${testSlot++}`;
  const [room] = rowsOf<{ id: string }>(
    await db.execute(sql`
      INSERT INTO rooms (name, capacity, description)
      VALUES (${roomName}, 20, 'Uso exclusivo de los tests automaticos')
      ON CONFLICT (name) DO UPDATE SET capacity = 20
      RETURNING id`),
  );
  const [ct] = rowsOf<{ id: string }>(await db.execute(sql`SELECT id FROM class_types WHERE slug = ${classTypeSlug}`));
  const offset = hoursFromNow;
  const [s] = rowsOf<{ id: string }>(
    await db.execute(sql`
      INSERT INTO class_sessions (class_type_id, room_id, local_date, start_time, starts_at, ends_at,
                                  duration_min, capacity, booked_count)
      VALUES (${ct.id}::uuid, ${room.id}::uuid,
              ((now() + (${offset}::int || ' hours')::interval) AT TIME ZONE 'America/Santiago')::date,
              '00:00', now() + (${offset}::int || ' hours')::interval,
              now() + ((${offset} + 1)::int || ' hours')::interval,
              60, ${capacity}, 0)
      RETURNING id`),
  );
  return s.id;
}

async function giveMembership(studentId: string, planSlug: string, credits = 5) {
  const [plan] = rowsOf<{ id: string }>(await db.execute(sql`SELECT id FROM plans WHERE slug = ${planSlug}`));
  // No se borran: las reservas sembradas las referencian. Se desactivan, que
  // ademas es lo que ocurriria en la realidad.
  await db.execute(sql`UPDATE memberships SET status = 'cancelled' WHERE student_id = ${studentId}::uuid`);
  // Se sueltan sus reservas futuras sembradas: si no, el limite de 1 clase por
  // dia (que SI debe existir) hace fallar la preparacion del escenario.
  await db.execute(sql`
    WITH freed AS (
      UPDATE reservations r SET status = 'cancelled', cancelled_at = now()
        FROM class_sessions s
       WHERE r.session_id = s.id AND r.student_id = ${studentId}::uuid
         AND r.status = 'booked' AND s.starts_at > now()
      RETURNING s.id AS session_id
    )
    UPDATE class_sessions cs SET booked_count = GREATEST(0, cs.booked_count - 1)
      FROM freed WHERE cs.id = freed.session_id`);
  const [m] = rowsOf<{ id: string }>(
    await db.execute(sql`
      INSERT INTO memberships (student_id, plan_id, status, credits_total, credits_used, starts_on, ends_on, price_paid_clp)
      VALUES (${studentId}::uuid, ${plan.id}::uuid, 'active', ${credits}, 0,
              (now() AT TIME ZONE 'America/Santiago')::date,
              (now() AT TIME ZONE 'America/Santiago')::date + 60, 0)
      RETURNING id`),
  );
  return m.id;
}

const creditsOf = async (mid: string) =>
  rowsOf<{ n: number }>(await db.execute(sql`SELECT (credits_total - credits_used)::int AS n FROM memberships WHERE id=${mid}::uuid`))[0].n;

async function main() {
  const students = rowsOf<{ id: string }>(await db.execute(sql`SELECT id FROM users WHERE role='student' ORDER BY created_at LIMIT 6`));

  /* ---- 1. Restriccion valle ---- */
  console.log("\n1. Restricción de horario valle (sólo lun-vie 15:00-17:00)");
  const valleStudent = students[0].id;
  const mValle = await giveMembership(valleStudent, "valle-8");

  const [nightClass] = rowsOf<{ id: string; start_time: string }>(
    await db.execute(sql`
      SELECT id, start_time::text FROM class_sessions
       WHERE start_time = '19:00' AND starts_at > now() + INTERVAL '2 days'
         AND booked_count < capacity AND status='scheduled'
       ORDER BY starts_at LIMIT 1`),
  );
  try {
    await createBooking(valleStudent, nightClass.id);
    check("plan valle rechazado en clase de 19:00", false, "permitió reservar");
  } catch (e) {
    const err = e as DomainError;
    check("plan valle rechazado en clase de 19:00", err.code === "PLAN_TIME_RESTRICTED", err.message);
  }

  const [valleClass] = rowsOf<{ id: string }>(
    await db.execute(sql`
      SELECT id FROM class_sessions
       WHERE start_time = '16:00' AND EXTRACT(DOW FROM local_date) BETWEEN 1 AND 5
         AND starts_at > now() + INTERVAL '2 days' AND booked_count < capacity AND status='scheduled'
       ORDER BY starts_at LIMIT 1`),
  );
  const valleResult = await createBooking(valleStudent, valleClass.id).then(
    () => "ok",
    (e) => (e as DomainError).message,
  );
  check("plan valle aceptado en clase de 16:00", valleResult === "ok", valleResult);

  /* ---- 2. Cancelacion a tiempo: devuelve credito ---- */
  console.log("\n2. Cancelación con más de 12 h de anticipación");
  const s2 = students[1].id;
  const m2 = await giveMembership(s2, "adulto-mensual-8");
  const farId = await makeTestSession(72); // 3 dias: muy por fuera de la ventana tardia
  const b2 = await createBooking(s2, farId);
  const after2 = await creditsOf(m2);
  check("reservar descuenta 1 crédito", after2 === 4, `quedan ${after2}`);
  const c2 = await cancelBooking(b2.reservationId, s2);
  check("cancelar a tiempo devuelve el crédito", c2.refunded && (await creditsOf(m2)) === 5, c2.message);

  /* ---- 3. Cancelacion tardia: pierde credito, libera cupo ---- */
  console.log("\n3. Cancelación tardía (menos de 12 h)");
  const s3 = students[2].id;
  const m3 = await giveMembership(s3, "adulto-mensual-8");
  const soonId = await makeTestSession(3); // dentro de las 12 h de la politica
  const b3 = await createBooking(s3, soonId);
  const before3 = rowsOf<{ n: number }>(await db.execute(sql`SELECT booked_count::int AS n FROM class_sessions WHERE id=${soonId}::uuid`))[0].n;
  const c3 = await cancelBooking(b3.reservationId, s3);
  const after3 = await creditsOf(m3);
  const freed = rowsOf<{ n: number }>(await db.execute(sql`SELECT booked_count::int AS n FROM class_sessions WHERE id=${soonId}::uuid`))[0].n;
  check("cancelación tardía NO devuelve el crédito", !c3.refunded && after3 === 4, `quedan ${after3}`);
  check("pero el cupo igual se libera", freed === before3 - 1, `${before3} → ${freed}`);
  check("queda registrada como late_cancelled", c3.wasLate);

  /* ---- 4. Lista de espera se promueve sola ---- */
  console.log("\n4. Promoción automática desde lista de espera");
  const s4 = students[3].id, s5 = students[4].id;
  const m4 = await giveMembership(s4, "adulto-mensual-8");
  await giveMembership(s5, "adulto-mensual-8");
  const targetId = await makeTestSession(96, "studio-pilates", 1); // un solo cupo
  const b4 = await createBooking(s4, targetId);
  await joinWaitlist(targetId, s5);
  const full = await createBooking(s5, targetId).then(() => "reservó", (e) => (e as DomainError).code);
  check("clase llena rechaza a la siguiente", full === "SESSION_FULL", String(full));

  await cancelBooking(b4.reservationId, s4);
  const promotedId = await promoteFromWaitlist(targetId);
  const [promotedRes] = rowsOf<{ student_id: string; source: string }>(
    await db.execute(sql`SELECT student_id, source::text AS source FROM reservations WHERE id=${promotedId}::uuid`),
  );
  check("al liberarse el cupo, la lista promueve sola", promotedRes?.student_id === s5, `origen: ${promotedRes?.source}`);
  check("quien canceló recuperó su crédito", (await creditsOf(m4)) === 5);

  /* ---- 5. Cancelacion del estudio ---- */
  console.log("\n5. Clase cancelada por el estudio");
  const s6 = students[5].id;
  const m6 = await giveMembership(s6, "adulto-mensual-8");
  const studioClassId = await makeTestSession(2); // en 2 horas: cancelacion tardia si fuera la alumna
  const b6 = await createBooking(s6, studioClassId);
  const c6 = await cancelBooking(b6.reservationId, s6, { asStudio: true });
  check("devuelve el crédito aunque falte 1 hora", c6.refunded && (await creditsOf(m6)) === 5, c6.message);

  // Limpieza: los tests no deben ensuciar los datos de la demo.
  await db.execute(sql`DELETE FROM credit_transactions WHERE reservation_id IN (
    SELECT r.id FROM reservations r JOIN class_sessions s ON s.id = r.session_id
     JOIN rooms rm ON rm.id = s.room_id WHERE rm.name LIKE 'Sala de pruebas%')`);
  await db.execute(sql`DELETE FROM waitlist_entries WHERE session_id IN (
    SELECT s.id FROM class_sessions s JOIN rooms rm ON rm.id = s.room_id WHERE rm.name LIKE 'Sala de pruebas%')`);
  await db.execute(sql`DELETE FROM reservations WHERE session_id IN (
    SELECT s.id FROM class_sessions s JOIN rooms rm ON rm.id = s.room_id WHERE rm.name LIKE 'Sala de pruebas%')`);
  await db.execute(sql`DELETE FROM class_sessions WHERE room_id IN (SELECT id FROM rooms WHERE name LIKE 'Sala de pruebas%')`);
  await db.execute(sql`DELETE FROM rooms WHERE name LIKE 'Sala de pruebas%'`);

  console.log(`\n${fail === 0 ? "TODAS LAS REGLAS SE CUMPLEN" : `${fail} FALLARON`} (${pass} ok, ${fail} fallidas)\n`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
