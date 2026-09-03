import express, { type Express } from "express";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { registerRoutes } from "./routes";

/**
 * Construye el app SIN llamar a listen(). Ésa es toda la razón de que este
 * archivo esté separado de server/index.ts: en Vercel el app se invoca como
 * handler de una función serverless y llamar a listen() ahí cuelga la lambda.
 */
export function buildApp(): Express {
  const app = express();
  app.set("trust proxy", true);

  // Los webhooks necesitan el cuerpo crudo para verificar la firma HMAC.
  // express.json() lo destruiría, así que va montado ANTES y sólo en esa ruta.
  app.use("/api/webhooks", express.raw({ type: "*/*", limit: "1mb" }));

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  registerRoutes(app);

  app.use("/api", notFound);
  app.use(errorHandler);

  return app;
}
