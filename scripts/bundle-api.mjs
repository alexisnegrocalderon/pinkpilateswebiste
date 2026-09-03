import { build } from "esbuild";

/**
 * El builder de Node.js de Vercel, para este proyecto (package.json con
 * "type": "module"), transpila el archivo de entrada archivo por archivo en
 * vez de empaquetarlo en uno solo: un import relativo como "./app" queda
 * intacto en el JS emitido, y el loader ESM de Node exige extensión
 * explícita para resolver módulos relativos — por eso en runtime tronaba
 * con ERR_MODULE_NOT_FOUND buscando "/var/task/server/app" a secas.
 *
 * Se empaqueta la función a mano: todo el árbol de server/ y shared/ queda
 * inline en un solo archivo (sin imports relativos que resolver en
 * runtime); las dependencias de npm quedan externas, resueltas desde
 * node_modules como en cualquier función Node normal.
 *
 * El resultado se escribe sobre api/index.js, que SÍ queda versionado: el
 * patrón "api/index.js" en vercel.json > functions se valida contra el
 * checkout de git antes de correr el build, así que el archivo debe existir
 * de antemano. Cada build lo regenera con el código actual.
 */
await build({
  entryPoints: ["server/vercel-handler.ts"],
  outfile: "api/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log("api/index.js generado");
