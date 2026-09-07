import type { MetadataRoute } from "next";

/**
 * Sólo las rutas públicas e indexables. /admin, /mi, /checkout, /pagar,
 * /pago quedan fuera (transaccionales o detrás de login, ver robots.ts).
 * Se amplía en la fase 3 con las landings del embudo.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pinkpilates.cl";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/planes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];
}
