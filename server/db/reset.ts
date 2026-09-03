import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./client";

/** Borra y recrea el esquema. Sólo para desarrollo y para rearmar la demo. */
async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("reset.ts no se ejecuta en producción.");
  }
  console.log("Borrando esquema public y el registro de migraciones...");
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  // Sin esto drizzle-kit cree que las migraciones ya estan aplicadas y no
  // recrea nada, dejando una base vacia que "migro correctamente".
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  console.log("Listo. Ahora: pnpm db:migrate && pnpm db:seed");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
