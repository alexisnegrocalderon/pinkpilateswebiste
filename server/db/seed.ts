import "dotenv/config";
import { sql } from "drizzle-orm";
import { addDaysToDate, todayInSantiago } from "@shared/domain/time";
import { db } from "./client";
import { hashPassword } from "../lib/password";
import { materializeRange, materializeSessions } from "../services/schedule.service";
import { CLASS_TYPES, INSTRUCTORS, PLANS, ROOMS, STUDENT_NAMES, TEMPLATES } from "./seed-data";
import { EMAIL_TEMPLATES } from "./seed-emails";

const rowsOf = <T>(r: unknown) => (Array.isArray(r) ? r : (r as { rows: unknown[] }).rows) as T[];
const pick = <T>(arr: readonly T[], i: number) => arr[i % arr.length];

const VALIDITY: Record<number, number> = { 1: 30, 3: 90, 6: 180, 12: 365 };

/** "Valdés" -> "valdes". Transliteracion real: quitar los acentos sin comerse la letra. */
const slugName = (v: string) =>
  v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

async function main() {
  console.log("Sembrando Pink Pilates...");
  const today = todayInSantiago();
  const password = await hashPassword("pinkpilates2026");

  /* ---------------- Salas ---------------- */
  for (const r of ROOMS) {
    await db.execute(sql`
      INSERT INTO rooms (name, capacity, description, location)
      VALUES (${r.name}, ${r.capacity}, ${r.description}, ${r.location})
      ON CONFLICT (name) DO UPDATE SET capacity = EXCLUDED.capacity
    `);
  }
  const rooms = Object.fromEntries(
    rowsOf<{ id: string; name: string }>(await db.execute(sql`SELECT id, name FROM rooms`)).map((r) => [r.name, r.id]),
  );

  /* ---------------- Tipos de clase ---------------- */
  for (const [i, c] of CLASS_TYPES.entries()) {
    await db.execute(sql`
      INSERT INTO class_types (slug, name, short_description, description, discipline, level,
                               default_duration_min, default_capacity, drop_in_price_clp, color, sort_order)
      VALUES (${c.slug}, ${c.name}, ${c.short}, ${c.desc}, ${c.discipline}::discipline, ${c.level}::class_level,
              60, ${c.capacity}, ${c.price}, ${c.color}, ${i})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, drop_in_price_clp = EXCLUDED.drop_in_price_clp
    `);
  }
  const classTypes = Object.fromEntries(
    rowsOf<{ id: string; slug: string }>(await db.execute(sql`SELECT id, slug FROM class_types`)).map((c) => [c.slug, c.id]),
  );

  /* ---------------- Planes ---------------- */
  for (const [i, p] of PLANS.entries()) {
    const valle = "valle" in p && p.valle;
    await db.execute(sql`
      INSERT INTO plans (slug, name, segment, period_months, credits, price_clp, validity_days,
                         requires_verification, is_drop_in, allowed_weekdays,
                         allowed_time_from, allowed_time_to, sort_order, badge)
      VALUES (${p.slug}, ${p.name}, ${p.segment}::plan_segment, ${p.months}, ${p.credits}, ${p.price},
              ${VALIDITY[p.months]}, ${"verify" in p && p.verify ? true : false},
              ${"dropIn" in p && p.dropIn ? true : false},
              ${valle ? sql`ARRAY[1,2,3,4,5]::smallint[]` : sql`NULL`},
              ${valle ? "15:00" : null}, ${valle ? "17:00" : null},
              ${i}, ${"badge" in p ? p.badge : null})
      ON CONFLICT (slug) DO UPDATE SET price_clp = EXCLUDED.price_clp, credits = EXCLUDED.credits
    `);
  }
  const plans = Object.fromEntries(
    rowsOf<{ id: string; slug: string }>(await db.execute(sql`SELECT id, slug FROM plans`)).map((p) => [p.slug, p.id]),
  );

  // Planes especiales: acotados a un único tipo de clase.
  for (const p of PLANS) {
    if (!("only" in p) || !p.only) continue;
    await db.execute(sql`
      INSERT INTO plan_class_types (plan_id, class_type_id)
      VALUES (${plans[p.slug]}::uuid, ${classTypes[p.only]}::uuid)
      ON CONFLICT DO NOTHING
    `);
  }

  /* ---------------- Personas ---------------- */
  await db.execute(sql`
    INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
    VALUES ('contacto@pinkpilates.cl', ${password}, 'owner', 'Javiera', 'De La Torre', '+56999471471')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'owner'
  `);

  for (const ins of INSTRUCTORS) {
    await db.execute(sql`
      INSERT INTO users (email, password_hash, role, first_name, last_name)
      VALUES (${ins.email}, ${password}, 'instructor', ${ins.first}, ${ins.last})
      ON CONFLICT (email) DO UPDATE SET role = 'instructor'
    `);
    await db.execute(sql`
      INSERT INTO instructor_profiles (user_id, bio, calendar_color, specialties)
      SELECT id, ${ins.bio}, ${ins.color}, ${sql.raw(`ARRAY['${ins.specialties.join("','")}']::discipline[]`)}
        FROM users WHERE email = ${ins.email}
      ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, calendar_color = EXCLUDED.calendar_color
    `);
  }
  const instructorIds = rowsOf<{ id: string }>(
    await db.execute(sql`SELECT id FROM users WHERE role = 'instructor' ORDER BY created_at`),
  ).map((r) => r.id);

  const studentIds: string[] = [];
  for (const [i, [first, last]] of STUDENT_NAMES.entries()) {
    const email = `${slugName(first)}.${slugName(last)}@ejemplo.cl`;
    const [u] = rowsOf<{ id: string }>(
      await db.execute(sql`
        INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
        VALUES (${email}, ${password}, 'student', ${first}, ${last},
                ${"+569" + String(60000000 + i * 137).padStart(8, "0")})
        ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
        RETURNING id
      `),
    );
    studentIds.push(u.id);
    await db.execute(sql`
      INSERT INTO student_profiles (user_id, marketing_opt_in, joined_at)
      VALUES (${u.id}::uuid, ${i % 7 !== 0}, now() - (${i * 11}::int || ' days')::interval)
      ON CONFLICT (user_id) DO NOTHING
    `);
  }

  /* ---------------- Plantillas de horario ---------------- */
  const typeToRoom = Object.fromEntries(CLASS_TYPES.map((c) => [c.slug, c.room]));
  const typeToCap = Object.fromEntries(CLASS_TYPES.map((c) => [c.slug, c.capacity]));
  const effectiveFrom = addDaysToDate(today, -60);

  for (const [i, t] of TEMPLATES.entries()) {
    await db.execute(sql`
      INSERT INTO class_templates (class_type_id, instructor_id, room_id, weekday, start_time,
                                   duration_min, capacity, effective_from)
      SELECT ${classTypes[t.classType]}::uuid, ${pick(instructorIds, i)}::uuid,
             ${rooms[typeToRoom[t.classType]]}::uuid, ${t.weekday}, ${t.time}::time,
             60, ${typeToCap[t.classType]}, ${effectiveFrom}::date
      WHERE NOT EXISTS (
        SELECT 1 FROM class_templates
         WHERE room_id = ${rooms[typeToRoom[t.classType]]}::uuid
           AND weekday = ${t.weekday} AND start_time = ${t.time}::time AND is_active
      )
    `);
  }

  /* ---------------- Ocurrencias: 3 semanas atrás y el horizonte hacia adelante ---------------- */
  // Historial hacia atrás para que los reportes tengan de dónde agarrarse.
  const past = await materializeRange(addDaysToDate(today, -90), addDaysToDate(today, -1));
  const created = await materializeSessions(addDaysToDate(today, 35));
  console.log(`  clases pasadas: ${past} · clases futuras: ${created}`);

  /* ---------------- Plantillas de email ---------------- */
  for (const t of EMAIL_TEMPLATES) {
    await db.execute(sql`
      INSERT INTO email_templates (key, name, subject, html_body, sample_vars)
      VALUES (${t.key}, ${t.name}, ${t.subject}, ${t.html}, ${JSON.stringify(t.sample)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET subject = EXCLUDED.subject, html_body = EXCLUDED.html_body
    `);
  }

  console.log("Base sembrada. Sigue con seed-activity.ts para membresías y reservas históricas.");
  console.log("Acceso dueña: contacto@pinkpilates.cl / pinkpilates2026");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
