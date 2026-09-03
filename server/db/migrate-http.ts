import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

/**
 * drizzle-kit migrate abre una conexión TCP cruda al puerto 5432, que este
 * entorno bloquea (sólo permite salida HTTPS por el proxy). Este script hace
 * lo mismo por HTTP, con el mismo driver que usa la app en producción.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL");

  const db = drizzle(neon(url));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migraciones aplicadas.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
