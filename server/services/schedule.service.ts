import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { getSetting } from "./settings.service";

/**
 * Genera las ocurrencias concretas (`class_sessions`) a partir de las reglas
 * semanales (`class_templates`).
 *
 * Todo ocurre en UNA sentencia por lote, no en un bucle de JavaScript:
 *   - `generate_series` recorre las fechas dentro de Postgres.
 *   - `(fecha + hora) AT TIME ZONE tz` calcula el instante respetando el cambio
 *     de hora de Chile. Nunca se usa un offset fijo.
 *   - `ON CONFLICT (template_id, local_date) DO NOTHING` la hace idempotente:
 *     re-ejecutarla no duplica clases ni pisa las que ya tienen inscritas.
 */
export async function materializeSessions(through?: string): Promise<number> {
  const horizonDays = await getSetting("booking_horizon_days");
  const limit = through ?? null;

  const result = await db.execute(sql`
    WITH bounds AS (
      SELECT (now() AT TIME ZONE 'America/Santiago')::date AS today,
             COALESCE(${limit}::date,
                      (now() AT TIME ZONE 'America/Santiago')::date + ${horizonDays}::int) AS through
    ),
    inserted AS (
      INSERT INTO class_sessions (
        template_id, class_type_id, instructor_id, room_id,
        local_date, start_time, starts_at, ends_at, duration_min, capacity
      )
      SELECT
        t.id, t.class_type_id, t.instructor_id, t.room_id,
        d::date,
        t.start_time,
        (d::date + t.start_time) AT TIME ZONE t.timezone,
        ((d::date + t.start_time) AT TIME ZONE t.timezone) + (t.duration_min || ' minutes')::interval,
        t.duration_min,
        t.capacity
      FROM class_templates t
      CROSS JOIN bounds b
      CROSS JOIN LATERAL generate_series(
        GREATEST(t.effective_from, b.today, COALESCE(t.materialized_through + 1, b.today)),
        LEAST(COALESCE(t.effective_to, DATE '9999-12-31'), b.through),
        INTERVAL '1 day'
      ) AS d
      WHERE t.is_active
        AND EXTRACT(DOW FROM d)::int = t.weekday
      ON CONFLICT (template_id, local_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*)::int AS created FROM inserted
  `);

  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { created: number }[];

  // Se avanza la marca aunque no se haya creado nada: las fechas ya quedaron cubiertas.
  await db.execute(sql`
    UPDATE class_templates t
       SET materialized_through = LEAST(
             COALESCE(t.effective_to, DATE '9999-12-31'),
             COALESCE(${limit}::date,
                      (now() AT TIME ZONE 'America/Santiago')::date + ${horizonDays}::int)
           ),
           updated_at = now()
     WHERE t.is_active
       AND (t.materialized_through IS NULL
            OR t.materialized_through < COALESCE(${limit}::date,
                 (now() AT TIME ZONE 'America/Santiago')::date + ${horizonDays}::int))
  `);

  return rows[0]?.created ?? 0;
}

/**
 * Materialización perezosa: en Vercel Hobby el cron corre una vez al día, así
 * que la agenda pública se asegura por sí misma de tener horizonte suficiente.
 */
export async function ensureHorizon(minDays = 14): Promise<void> {
  const result = await db.execute(sql`
    SELECT count(*)::int AS pending
      FROM class_templates
     WHERE is_active
       AND (materialized_through IS NULL
            OR materialized_through < (now() AT TIME ZONE 'America/Santiago')::date + ${minDays}::int)
       AND (effective_to IS NULL
            OR effective_to >= (now() AT TIME ZONE 'America/Santiago')::date)
  `);
  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { pending: number }[];
  if ((rows[0]?.pending ?? 0) > 0) await materializeSessions();
}

/**
 * Genera ocurrencias en un rango arbitrario, ignorando `materialized_through`
 * y permitiendo fechas pasadas.
 *
 * `materializeSessions` tiene piso en "hoy" a propósito: en operación normal
 * jamás se deben inventar clases retroactivas. Esto es exclusivamente para
 * sembrar historial de demostración y para rellenar un hueco a mano.
 */
export async function materializeRange(from: string, to: string): Promise<number> {
  const result = await db.execute(sql`
    WITH inserted AS (
      INSERT INTO class_sessions (
        template_id, class_type_id, instructor_id, room_id,
        local_date, start_time, starts_at, ends_at, duration_min, capacity
      )
      SELECT
        t.id, t.class_type_id, t.instructor_id, t.room_id,
        d::date,
        t.start_time,
        (d::date + t.start_time) AT TIME ZONE t.timezone,
        ((d::date + t.start_time) AT TIME ZONE t.timezone) + (t.duration_min || ' minutes')::interval,
        t.duration_min,
        t.capacity
      FROM class_templates t
      CROSS JOIN LATERAL generate_series(
        GREATEST(t.effective_from, ${from}::date),
        LEAST(COALESCE(t.effective_to, DATE '9999-12-31'), ${to}::date),
        INTERVAL '1 day'
      ) AS d
      WHERE t.is_active
        AND EXTRACT(DOW FROM d)::int = t.weekday
      ON CONFLICT (template_id, local_date) DO NOTHING
      RETURNING 1
    )
    SELECT count(*)::int AS created FROM inserted
  `);
  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { created: number }[];
  return rows[0]?.created ?? 0;
}
