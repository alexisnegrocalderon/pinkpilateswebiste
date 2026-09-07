import { Router } from "express";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { classTypes, contactLeads, plans } from "@shared/schema";
import { db } from "../db/client";
import { wrap } from "../middleware/errorHandler";

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
