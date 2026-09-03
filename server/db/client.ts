import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import { env } from "../env";

/**
 * Dos drivers, una misma API de Drizzle:
 *
 * - Neon (producción): driver HTTP. Sin conexiones persistentes, ideal para
 *   serverless, pero SIN transacciones interactivas — de ahí que las
 *   operaciones críticas de cupos y créditos sean una sola sentencia SQL
 *   (ver server/sql/bookSpot.sql.ts).
 * - Postgres local (desarrollo): node-postgres con pool.
 *
 * La detección es por host, no por NODE_ENV, para poder apuntar a Neon desde
 * la máquina local sin cambiar código.
 */
const url = env().DATABASE_URL;
const isNeon = /neon\.tech/i.test(url);

function build() {
  if (isNeon) {
    return drizzleHttp(neon(url), { schema, casing: "snake_case" });
  }
  const pool = new Pool({ connectionString: url, max: 5 });
  return drizzleNode(pool, { schema, casing: "snake_case" });
}

type Db = ReturnType<typeof build>;

// En serverless cada invocación es un proceso nuevo, pero dentro de una misma
// invocación (y en el dev server, que sí es de larga vida) se reutiliza.
const globalForDb = globalThis as unknown as { __ppDb?: Db };
export const db: Db = globalForDb.__ppDb ?? build();
if (!globalForDb.__ppDb) globalForDb.__ppDb = db;

export { schema };
export const usingNeon = isNeon;
