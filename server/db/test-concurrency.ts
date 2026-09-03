import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./client";
import { bookSpot } from "../sql/bookSpot.sql";

const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];

/**
 * La prueba que justifica todo el diseño de bookSpot: N alumnas peleando UN cupo.
 * Debe terminar con exactamente 1 reserva, 1 crédito descontado y booked_count
 * igual a capacity. Ni uno más.
 */
async function main() {
  const CONTENDERS = 10;

  // Una clase futura vacía con capacidad forzada a 1.
  const [session] = rowsOf<{ id: string; class_type_id: string }>(
    await db.execute(sql`
      SELECT s.id, s.class_type_id FROM class_sessions s
       WHERE s.starts_at > now() + INTERVAL '3 days' AND s.booked_count = 0
       ORDER BY s.starts_at LIMIT 1
    `),
  );
  await db.execute(sql`UPDATE class_sessions SET capacity = 1, booked_count = 0 WHERE id = ${session.id}::uuid`);
  await db.execute(sql`DELETE FROM reservations WHERE session_id = ${session.id}::uuid`);

  // 10 alumnas, cada una con su propia membresía de 5 créditos.
  const [plan] = rowsOf<{ id: string }>(await db.execute(sql`SELECT id FROM plans WHERE slug = 'adulto-mensual-8'`));
  const students = rowsOf<{ id: string }>(
    await db.execute(sql`SELECT id FROM users WHERE role = 'student' ORDER BY created_at LIMIT ${CONTENDERS}`),
  );

  const memberships: { studentId: string; membershipId: string }[] = [];
  for (const s of students) {
    await db.execute(sql`DELETE FROM memberships WHERE student_id = ${s.id}::uuid AND price_paid_clp = 1`);
    const [m] = rowsOf<{ id: string }>(
      await db.execute(sql`
        INSERT INTO memberships (student_id, plan_id, status, credits_total, credits_used,
                                 starts_on, ends_on, price_paid_clp)
        VALUES (${s.id}::uuid, ${plan.id}::uuid, 'active', 5, 0,
                (now() AT TIME ZONE 'America/Santiago')::date,
                (now() AT TIME ZONE 'America/Santiago')::date + 30, 1)
        RETURNING id
      `),
    );
    memberships.push({ studentId: s.id, membershipId: m.id });
  }

  console.log(`Lanzando ${CONTENDERS} reservas simultáneas sobre 1 cupo...\n`);

  const results = await Promise.all(
    memberships.map((m) =>
      bookSpot({
        sessionId: session.id,
        studentId: m.studentId,
        membershipId: m.membershipId,
        closeMinutesBefore: 60,
      }).then(
        (r) => (r ? "OK" : "RECHAZADA"),
        (e) => `ERROR:${(e as Error).message.slice(0, 40)}`,
      ),
    ),
  );

  const ok = results.filter((r) => r === "OK").length;
  const rejected = results.filter((r) => r === "RECHAZADA").length;
  const errors = results.filter((r) => r.startsWith("ERROR"));

  const [state] = rowsOf<{ booked_count: number; capacity: number }>(
    await db.execute(sql`SELECT booked_count, capacity FROM class_sessions WHERE id = ${session.id}::uuid`),
  );
  const [res] = rowsOf<{ n: number }>(
    await db.execute(sql`SELECT count(*)::int AS n FROM reservations WHERE session_id = ${session.id}::uuid AND status = 'booked'`),
  );
  const [debits] = rowsOf<{ n: number }>(
    await db.execute(sql`
      SELECT count(*)::int AS n FROM credit_transactions
       WHERE reason = 'booking' AND reservation_id IN (SELECT id FROM reservations WHERE session_id = ${session.id}::uuid)
    `),
  );
  const [spent] = rowsOf<{ n: number }>(
    await db.execute(sql`SELECT COALESCE(sum(credits_used),0)::int AS n FROM memberships WHERE price_paid_clp = 1`),
  );

  const check = (label: string, actual: unknown, expected: unknown) => {
    const pass = String(actual) === String(expected);
    console.log(`  ${pass ? "✓" : "✗"} ${label}: ${actual}${pass ? "" : ` (esperado ${expected})`}`);
    return pass;
  };

  let allPass = true;
  allPass = check("reservas exitosas", ok, 1) && allPass;
  allPass = check("reservas rechazadas", rejected, CONTENDERS - 1) && allPass;
  allPass = check("errores inesperados", errors.length, 0) && allPass;
  allPass = check("booked_count final", state.booked_count, state.capacity) && allPass;
  allPass = check("filas de reserva activas", res.n, 1) && allPass;
  allPass = check("débitos en el libro mayor", debits.n, 1) && allPass;
  allPass = check("créditos consumidos en total", spent.n, 1) && allPass;

  if (errors.length) console.log("\n  errores:", errors.slice(0, 3));

  // Limpieza: la prueba no debe dejar rastro en los datos de la demo.
  await db.execute(sql`DELETE FROM credit_transactions WHERE membership_id IN (SELECT id FROM memberships WHERE price_paid_clp = 1)`);
  await db.execute(sql`DELETE FROM reservations WHERE session_id = ${session.id}::uuid`);
  await db.execute(sql`DELETE FROM memberships WHERE price_paid_clp = 1`);
  await db.execute(sql`UPDATE class_sessions SET capacity = (SELECT default_capacity FROM class_types WHERE id = ${session.class_type_id}::uuid), booked_count = 0 WHERE id = ${session.id}::uuid`);

  console.log(allPass ? "\nSIN OVERBOOKING POSIBLE.\n" : "\nFALLÓ.\n");
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
