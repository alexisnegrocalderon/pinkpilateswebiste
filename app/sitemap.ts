import type { MetadataRoute } from "next";
import { and, asc, eq } from "drizzle-orm";
import { classTypes } from "@shared/schema";
import { db } from "../server/db/client";

/**
 * Sólo las rutas públicas e indexables. El sitio ya no gestiona reservas ni
 * cuentas (Javiera usa CrossHero) — /admin, /ingresar quedan fuera (ver
 * robots.ts). El resto son páginas de marketing/SEO.
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
    { url: `${base}/horarios`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/quienes-somos`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/reglamento`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/formacion-instructores`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/galeria`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
