import "dotenv/config";
import { sql } from "drizzle-orm";
import { addDaysToDate, todayInSantiago } from "@shared/domain/time";
import { db } from "./client";

const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];

/** Aleatorio determinista: la demo se ve igual cada vez que se resiembra. */
let seed = 20260903;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pickOne = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];

async function main() {
  const today = todayInSantiago();
  console.log("Sembrando actividad...");

  const students = rowsOf<{ id: string; first_name: string }>(
    await db.execute(sql`SELECT id, first_name FROM users WHERE role = 'student' ORDER BY created_at`),
  );
  const plans = Object.fromEntries(
    rowsOf<{ id: string; slug: string; name: string; credits: number; price_clp: number; validity_days: number }>(
      await db.execute(sql`SELECT id, slug, name, credits, price_clp, validity_days FROM plans`),
    ).map((p) => [p.slug, p]),
  );

  await db.execute(sql`DELETE FROM credit_transactions`);
  await db.execute(sql`DELETE FROM waitlist_entries`);
  await db.execute(sql`DELETE FROM reservations`);
  await db.execute(sql`UPDATE class_sessions SET booked_count = 0, waitlist_count = 0`);
  await db.execute(sql`DELETE FROM memberships`);
  await db.execute(sql`DELETE FROM orders`);

  /* ---------- Membresías en todos los estados que la dueña debe saber leer ---------- */
  const catalog = ["adulto-mensual-8", "adulto-mensual-12", "adulto-mensual-4", "valle-8", "est-mensual-8", "adulto-trim-24", "mat-8", "baile-8"];

  for (const [i, st] of students.entries()) {
    const bucket = i % 10;
    const planSlug = bucket === 3 ? "valle-8" : bucket === 5 ? "est-mensual-8" : pickOne(catalog);
    const plan = plans[planSlug];

    // Reparto deliberado: activas, por vencer, agotadas, vencidas y una pendiente
    // de verificar. Así el panel muestra todos los casos desde el primer minuto.
    let startsOn: string, endsOn: string, used: number, status: string;
    if (bucket === 0) { startsOn = addDaysToDate(today, -50); endsOn = addDaysToDate(today, -20); used = plan.credits; status = "expired"; }
    else if (bucket === 1) { startsOn = addDaysToDate(today, -28); endsOn = addDaysToDate(today, 3); used = plan.credits - 1; status = "active"; }
    else if (bucket === 2) { startsOn = addDaysToDate(today, -20); endsOn = addDaysToDate(today, 10); used = plan.credits; status = "depleted"; }
    else if (bucket === 5) { startsOn = today; endsOn = addDaysToDate(today, plan.validity_days); used = 0; status = "pending_verification"; }
    else { startsOn = addDaysToDate(today, -12); endsOn = addDaysToDate(today, plan.validity_days - 12); used = Math.floor(rnd() * Math.max(1, plan.credits - 2)); status = "active"; }

    // Se toma de la misma secuencia que usa la aplicacion, para que los numeros
    // de orden de la demo y los que se generen en vivo no colisionen.
    const [seqRow] = rowsOf<{ n: number }>(await db.execute(sql`SELECT nextval('order_number_seq')::int AS n`));
    const orderNumber = `PP-2026-${String(seqRow.n).padStart(6, "0")}`;
    const [order] = rowsOf<{ id: string }>(
      await db.execute(sql`
        INSERT INTO orders (order_number, student_id, status, subtotal_clp, discount_clp, total_clp, provider, paid_at, created_at)
        VALUES (${orderNumber}, ${st.id}::uuid, 'paid', ${plan.price_clp}, 0, ${plan.price_clp}, 'mock',
                -- Los planes vigentes se pagaron este mes: es cuando la gente
                -- renueva. Los vencidos conservan su fecha original.
                ${["active", "depleted", "pending_verification"].includes(status)
                  ? sql`(date_trunc('month', now() AT TIME ZONE 'America/Santiago')
                        + (floor(random() * GREATEST(1, EXTRACT(DAY FROM now() AT TIME ZONE 'America/Santiago')))::int || ' days')::interval
                        + INTERVAL '12 hours') AT TIME ZONE 'America/Santiago'`
                  : sql`${startsOn}::date`},
                ${startsOn}::date)
        RETURNING id
      `),
    );
    await db.execute(sql`
      INSERT INTO order_items (order_id, kind, plan_id, description, unit_price_clp, quantity, total_clp)
      VALUES (${order.id}::uuid, 'plan', ${plan.id}::uuid, ${plan.name}, ${plan.price_clp}, 1, ${plan.price_clp})
    `);

    const [m] = rowsOf<{ id: string }>(
      await db.execute(sql`
        INSERT INTO memberships (student_id, plan_id, order_id, status, credits_total, credits_used,
                                 starts_on, ends_on, activated_at, price_paid_clp)
        VALUES (${st.id}::uuid, ${plan.id}::uuid, ${order.id}::uuid, ${status}::membership_status,
                ${plan.credits}, ${used}, ${startsOn}::date, ${endsOn}::date, ${startsOn}::date, ${plan.price_clp})
        RETURNING id
      `),
    );
    await db.execute(sql`
      INSERT INTO credit_transactions (membership_id, student_id, delta, reason, note, created_at)
      VALUES (${m.id}::uuid, ${st.id}::uuid, ${plan.credits}, 'purchase', ${"Compra " + orderNumber}, ${startsOn}::date)
    `);
  }

  /* ---------- Renovaciones pasadas ----------
     Un estudio real tiene alumnas que renuevan mes a mes. Sin este historial,
     el grafico de ingresos y la comparacion contra el mes anterior quedan
     vacios, y el panel parece recien inaugurado. Las compras se concentran en
     los primeros dias de cada mes, que es cuando la gente renueva. */
  for (const [i, st] of students.entries()) {
    const renovaciones = i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1;
    for (let atras = 1; atras <= renovaciones; atras++) {
      const plan = plans[pickOne(catalog)];
      // Dia 1 a 5 del mes correspondiente: patron tipico de renovacion.
      const dia = 1 + Math.floor(rnd() * 5);
      const [seqRow] = rowsOf<{ n: number }>(await db.execute(sql`SELECT nextval('order_number_seq')::int AS n`));
      const orderNumber = `PP-2026-${String(seqRow.n).padStart(6, "0")}`;

      const [order] = rowsOf<{ id: string }>(
        await db.execute(sql`
          INSERT INTO orders (order_number, student_id, status, subtotal_clp, discount_clp, total_clp, provider, paid_at, created_at)
          VALUES (${orderNumber}, ${st.id}::uuid, 'paid', ${plan.price_clp}, 0, ${plan.price_clp}, 'mock',
                  (date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - (${atras}::int || ' months')::interval)
                    + (${dia - 1}::int || ' days')::interval + INTERVAL '12 hours') AT TIME ZONE 'America/Santiago',
                  (date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - (${atras}::int || ' months')::interval)
                    + (${dia - 1}::int || ' days')::interval + INTERVAL '12 hours') AT TIME ZONE 'America/Santiago')
          RETURNING id`),
      );
      await db.execute(sql`
        INSERT INTO order_items (order_id, kind, plan_id, description, unit_price_clp, quantity, total_clp)
        VALUES (${order.id}::uuid, 'plan', ${plan.id}::uuid, ${plan.name}, ${plan.price_clp}, 1, ${plan.price_clp})`);
      await db.execute(sql`
        INSERT INTO memberships (student_id, plan_id, order_id, status, credits_total, credits_used,
                                 starts_on, ends_on, activated_at, price_paid_clp)
        VALUES (${st.id}::uuid, ${plan.id}::uuid, ${order.id}::uuid, 'expired',
                ${plan.credits}, ${plan.credits},
                (date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - (${atras}::int || ' months')::interval))::date,
                (date_trunc('month', (now() AT TIME ZONE 'America/Santiago') - (${atras - 1}::int || ' months')::interval))::date,
                now(), ${plan.price_clp})`);
    }
  }

  /* ---------- Historial de asistencia en las clases ya pasadas ---------- */
  const pastSessions = rowsOf<{ id: string; capacity: number }>(
    await db.execute(sql`
      SELECT id, capacity FROM class_sessions
       WHERE starts_at < now() AND starts_at > now() - INTERVAL '21 days'
       ORDER BY starts_at
    `),
  );

  let historic = 0;
  for (const s of pastSessions) {
    const attendees = Math.min(s.capacity, Math.max(1, Math.round(s.capacity * (0.55 + rnd() * 0.45))));
    const chosen = new Set<string>();
    while (chosen.size < attendees && chosen.size < students.length) chosen.add(pickOne(students).id);

    for (const studentId of chosen) {
      const roll = rnd();
      const status = roll < 0.84 ? "attended" : roll < 0.93 ? "no_show" : "late_cancelled";
      await db.execute(sql`
        INSERT INTO reservations (session_id, student_id, status, source, credit_charged, booked_at, checked_in_at)
        VALUES (${s.id}::uuid, ${studentId}::uuid, ${status}::reservation_status, 'web', true,
                (SELECT starts_at - INTERVAL '3 days' FROM class_sessions WHERE id = ${s.id}::uuid),
                ${status === "attended" ? sql`(SELECT starts_at FROM class_sessions WHERE id = ${s.id}::uuid)` : sql`NULL`})
        ON CONFLICT DO NOTHING
      `);
      historic++;
    }
    // late_cancelled libera el cupo: no cuenta para booked_count.
    await db.execute(sql`
      UPDATE class_sessions SET booked_count = (
        SELECT count(*) FROM reservations
         WHERE session_id = ${s.id}::uuid AND status IN ('booked','attended','no_show')
      ) WHERE id = ${s.id}::uuid
    `);
  }

  /* ---------- Reservas futuras, incluyendo tres clases llenas con lista de espera ---------- */
  const futureSessions = rowsOf<{ id: string; capacity: number }>(
    await db.execute(sql`
      SELECT id, capacity FROM class_sessions
       WHERE starts_at > now() AND starts_at < now() + INTERVAL '10 days'
       ORDER BY starts_at LIMIT 60
    `),
  );

  const activeStudents = rowsOf<{ id: string }>(
    await db.execute(sql`
      SELECT DISTINCT student_id AS id FROM memberships
       WHERE status = 'active' AND credits_used < credits_total
    `),
  );

  let future = 0;
  for (const [idx, s] of futureSessions.entries()) {
    // Las tres primeras se llenan a tope para poder demostrar la lista de espera.
    const fill = idx < 3 ? s.capacity : Math.round(s.capacity * (0.2 + rnd() * 0.6));
    const chosen = new Set<string>();
    while (chosen.size < fill && chosen.size < activeStudents.length) chosen.add(pickOne(activeStudents).id);

    for (const studentId of chosen) {
      await db.execute(sql`
        INSERT INTO reservations (session_id, student_id, membership_id, status, source, credit_charged)
        SELECT ${s.id}::uuid, ${studentId}::uuid, m.id, 'booked', 'web', true
          FROM memberships m
         WHERE m.student_id = ${studentId}::uuid AND m.status = 'active'
         ORDER BY m.ends_on LIMIT 1
        ON CONFLICT DO NOTHING
      `);
      future++;
    }
    await db.execute(sql`
      UPDATE class_sessions SET booked_count = (
        SELECT count(*) FROM reservations
         WHERE session_id = ${s.id}::uuid AND status IN ('booked','attended','no_show')
      ) WHERE id = ${s.id}::uuid
    `);

    if (idx < 3) {
      for (let k = 0; k < 2 + Math.floor(rnd() * 3); k++) {
        const cand = pickOne(activeStudents).id;
        if (chosen.has(cand)) continue;
        await db.execute(sql`
          INSERT INTO waitlist_entries (session_id, student_id, created_at)
          VALUES (${s.id}::uuid, ${cand}::uuid, now() - (${k}::int || ' hours')::interval)
          ON CONFLICT DO NOTHING
        `);
      }
      await db.execute(sql`
        UPDATE class_sessions SET waitlist_count = (
          SELECT count(*) FROM waitlist_entries WHERE session_id = ${s.id}::uuid AND status = 'waiting'
        ) WHERE id = ${s.id}::uuid
      `);
    }
  }

  console.log(`  membresías: ${students.length}`);
  console.log(`  reservas históricas: ${historic}`);
  console.log(`  reservas futuras: ${future}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
