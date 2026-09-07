import type { MetadataRoute } from "next";
import { and, asc, eq } from "drizzle-orm";
import { classTypes } from "@shared/schema";
import { db } from "../server/db/client";

/**
 * Sólo las rutas públicas e indexables. /admin, /mi, /checkout, /pagar,
 * /pago quedan fuera (transaccionales o detrás de login, ver robots.ts).
 * Se amplía en la fase 3 con las landings del embudo.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://pinkpilates.cl";
  const now = new Date();

  const clases = await db
    .select({ slug: classTypes.slug })
    .from(classTypes)
    .where(and(eq(classTypes.isActive, true), eq(classTypes.isPublic, true)))
    .orderBy(asc(classTypes.sortOrder));

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/clases`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...clases.map((c) => ({
      url: `${base}/clases/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${base}/planes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];
}
