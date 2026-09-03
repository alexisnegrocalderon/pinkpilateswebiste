import type { IncomingMessage, ServerResponse } from "http";
import { buildApp } from "../server/app";

/**
 * Punto de entrada de Vercel. El app se construye una vez por contenedor
 * caliente y se reutiliza entre invocaciones.
 */
const app = buildApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (r: IncomingMessage, s: ServerResponse) => void)(req, res);
}
