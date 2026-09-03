import type { Express } from "express";
import { sql } from "drizzle-orm";
import { db, usingNeon } from "../db/client";
import { wrap } from "../middleware/errorHandler";
import { loadSession } from "../middleware/session";
import { authRouter } from "./auth.routes";
import { publicRouter } from "./public.routes";
import { studentRouter } from "./student.routes";
import { paymentsRouter, webhooksRouter } from "./payments.routes";
import { adminRouter } from "./admin.routes";

export function registerRoutes(app: Express) {
  app.use(loadSession);

  app.get(
    "/api/health",
    wrap(async (_req, res) => {
      const started = Date.now();
      const result = await db.execute<{ now: string; today: string }>(
        sql`SELECT now() AS now, (now() AT TIME ZONE 'America/Santiago')::date AS today`,
      );
      const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as {
        now: string;
        today: string;
      }[];

      res.json({
        data: {
          ok: true,
          driver: usingNeon ? "neon-http" : "node-postgres",
          dbLatencyMs: Date.now() - started,
          serverTime: rows[0]?.now ?? null,
          studioToday: rows[0]?.today ?? null,
        },
      });
    }),
  );

  app.use("/api/auth", authRouter);
  app.use("/api/public", publicRouter);
  app.use("/api", studentRouter);
  app.use("/api", paymentsRouter);
  app.use("/api/webhooks", webhooksRouter);
  app.use("/api/admin", adminRouter);
}
