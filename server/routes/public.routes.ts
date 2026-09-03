import { Router } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { classTypes, contactLeads, instructorProfiles, plans, users } from "@shared/schema";
import { db } from "../db/client";
import { wrap } from "../middleware/errorHandler";
import { ensureHorizon } from "../services/schedule.service";

export const publicRouter = Router();

publicRouter.get(
  "/class-types",
  wrap(async (_req, res) => {
    const rows = await db
      .select()
      .from(classTypes)
      .where(and(eq(classTypes.isActive, true), eq(classTypes.isPublic, true)))
      .orderBy(asc(classTypes.sortOrder));
    res.json({ data: rows });
  }),
);

const scheduleQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  classTypeId: z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
});

/**
 * Agenda pública. Además de leer, se asegura de que el horizonte de clases
 * materializadas alcance: en Vercel Hobby el cron corre una vez al día y no
 * basta para mantener la agenda poblada.
 */
publicRouter.get(
  "/schedule",
  wrap(async (req, res) => {
    const q = scheduleQuery.parse(req.query);
    await ensureHorizon(14);

    const result = await db.execute(sql`
      SELECT s.id,
             s.local_date::text            AS "localDate",
             s.start_time::text            AS "startTime",
             s.starts_at                   AS "startsAt",
             s.ends_at                     AS "endsAt",
             s.duration_min                AS "durationMin",
             s.capacity,
             s.booked_count                AS "bookedCount",
             s.waitlist_count              AS "waitlistCount",
             GREATEST(0, s.capacity - s.booked_count) AS "spotsLeft",
             (s.booked_count >= s.capacity)           AS "isFull",
             -- Una clase que ya empezo (o esta dentro de la ventana de cierre)
             -- no debe ofrecer boton de reservar: el servidor la rechazaria y
             -- la alumna se llevaria un error evitable.
             (s.starts_at <= now() + (COALESCE(
                (SELECT (value #>> '{}')::int FROM settings WHERE key = 'booking_closes_minutes_before'), 60
              ) || ' minutes')::interval)              AS "bookingClosed",
             s.status::text                AS status,
             ct.id                         AS "classTypeId",
             ct.name                       AS "className",
             ct.slug                       AS "classSlug",
             ct.discipline::text           AS discipline,
             ct.color,
             ct.drop_in_price_clp          AS "dropInPriceClp",
             r.name                        AS "roomName",
             i.id                          AS "instructorId",
             COALESCE(i.first_name || ' ' || i.last_name, 'Por confirmar') AS "instructorName"
        FROM class_sessions s
        JOIN class_types ct ON ct.id = s.class_type_id
        JOIN rooms r        ON r.id = s.room_id
        LEFT JOIN users i   ON i.id = s.instructor_id
       WHERE s.status = 'scheduled'
         AND ct.is_public
         AND s.local_date >= COALESCE(${q.from ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date)
         AND s.local_date <= COALESCE(${q.to ?? null}::date, (now() AT TIME ZONE 'America/Santiago')::date + 14)
         AND (${q.classTypeId ?? null}::uuid IS NULL OR s.class_type_id = ${q.classTypeId ?? null}::uuid)
         AND (${q.instructorId ?? null}::uuid IS NULL OR s.instructor_id = ${q.instructorId ?? null}::uuid)
       ORDER BY s.starts_at ASC
    `);

    const rows = Array.isArray(result) ? result : (result as { rows: unknown[] }).rows;
    res.json({ data: rows });
  }),
);

publicRouter.get(
  "/plans",
  wrap(async (_req, res) => {
    const rows = await db
      .select()
      .from(plans)
      .where(and(eq(plans.isActive, true), eq(plans.isPublic, true)))
      .orderBy(asc(plans.sortOrder), asc(plans.priceClp));
    res.json({ data: rows });
  }),
);

publicRouter.get(
  "/instructors",
  wrap(async (_req, res) => {
    const rows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        bio: instructorProfiles.bio,
        specialties: instructorProfiles.specialties,
        calendarColor: instructorProfiles.calendarColor,
      })
      .from(instructorProfiles)
      .innerJoin(users, eq(users.id, instructorProfiles.userId))
      .where(eq(instructorProfiles.isActive, true));
    res.json({ data: rows });
  }),
);

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().optional(),
  message: z.string().trim().max(2000).optional(),
  interest: z.string().trim().max(120).optional(),
});

publicRouter.post(
  "/contact",
  wrap(async (req, res) => {
    const input = contactSchema.parse(req.body);
    await db.insert(contactLeads).values(input);
    res.status(201).json({ data: { ok: true } });
  }),
);
