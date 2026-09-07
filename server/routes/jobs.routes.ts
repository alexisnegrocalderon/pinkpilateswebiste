import { Router } from "express";
import { fail } from "@shared/domain/errors";
import { env } from "../env";
import { runDailyJob } from "../jobs/daily.job";
import { wrap } from "../middleware/errorHandler";

export const jobsRouter = Router();

/**
 * Vercel manda el secreto como `Authorization: Bearer <CRON_SECRET>` cuando
 * la variable de entorno se llama exactamente CRON_SECRET (lo hace solo, sin
 * configuración adicional). Se acepta también `x-cron-secret` para poder
 * dispararlo a mano (curl, verificación post-deploy).
 */
function isAuthorized(req: { headers: Record<string, unknown> }): boolean {
  const secret = env().CRON_SECRET;
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth === `Bearer ${secret}`) return true;
  const header = req.headers["x-cron-secret"];
  return typeof header === "string" && header === secret;
}

jobsRouter.post(
  "/run",
  wrap(async (req, res) => {
    if (!isAuthorized(req)) fail("UNAUTHENTICATED", "Secreto de cron inválido o ausente.");

    const job = (req.query.job as string | undefined) ?? "daily";
    if (job !== "daily") fail("VALIDATION", `Job desconocido: ${job}`);

    const result = await runDailyJob();
    res.json({ data: { job, ...result } });
  }),
);
