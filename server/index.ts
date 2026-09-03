import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import "dotenv/config";
import { buildApp } from "./app";
import { env } from "./env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Arranque local. En Vercel NO se usa este archivo: allí el punto de entrada es
 * api/index.ts y los estáticos los sirve el CDN, no Express.
 */
function start() {
  const app = buildApp();

  if (env().NODE_ENV === "production") {
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(staticPath, "index.html")));
  }

  const port = env().PORT;
  app.listen(port, () => {
    console.log(`API Pink Pilates escuchando en http://localhost:${port}`);
  });
}

start();
