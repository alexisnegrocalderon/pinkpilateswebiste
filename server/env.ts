import { z } from "zod";

/**
 * Validación temprana de entorno: es preferible que el arranque falle con un
 * mensaje claro a que una lambda reviente a mitad de un pago.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  SESSION_SECRET: z.string().min(8).default("dev-session-secret"),
  MOCK_WEBHOOK_SECRET: z.string().min(8).default("dev-mock-webhook-secret"),
  CRON_SECRET: z.string().min(8).default("dev-cron-secret"),
  PAYMENTS_PROVIDER: z.enum(["mock", "mercadopago", "flow", "transbank"]).default("mock"),
  APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  VERCEL_URL: z.string().optional(),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variables de entorno inválidas:\n${detail}`);
  }
  cached = parsed.data;
  return cached;
}

/** URL pública absoluta; en Vercel se deriva de VERCEL_URL si no hay APP_URL. */
export function appUrl() {
  const e = env();
  if (e.APP_URL) return e.APP_URL.replace(/\/$/, "");
  if (e.VERCEL_URL) return `https://${e.VERCEL_URL}`;
  return `http://localhost:${e.PORT}`;
}

export const isProd = () => env().NODE_ENV === "production";
