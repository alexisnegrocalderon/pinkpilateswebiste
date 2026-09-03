import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const tables = await sql`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'`;
  const exclude = await sql`SELECT conname FROM pg_constraint WHERE conname='ex_session_room_overlap'`;
  const exts = await sql`SELECT extname FROM pg_extension ORDER BY extname`;
  console.log("tablas:", tables[0].n);
  console.log("constraint anti-solape:", exclude.length ? "OK" : "FALTA");
  console.log("extensiones:", exts.map((e: any) => e.extname).join(", "));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
