import type { NextConfig } from "next";

/**
 * El backend sigue siendo el Express de siempre (server/, empaquetado en
 * api/index.js) — Next.js sólo reemplaza la capa de presentación. En
 * producción Vercel ya rutea /api/* a esa función (vercel.json); en local,
 * el dev server de Next corre en :3000 y necesita el mismo proxy que antes
 * tenía vite.config.ts para que la cookie de sesión (SameSite=Lax) viaje.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    // Sólo en local: en Vercel, vercel.json ya rutea /api/* a la función antes
    // de que Next.js entre a jugar. Repetirlo acá apuntando a localhost
    // rompería producción.
    if (process.env.NODE_ENV === "production") return [];
    return [{ source: "/api/:path*", destination: "http://127.0.0.1:3001/api/:path*" }];
  },
};

export default nextConfig;
