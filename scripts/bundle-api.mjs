import { build } from "esbuild";

/**
 * El builder de Node.js de Vercel, para este proyecto (package.json con
 * "type": "module"), transpila api/index.ts archivo por archivo en vez de
 * empaquetarlo en uno solo: el import relativo "../server/app" queda
 * intacto en el JS emitido, y el loader ESM de Node exige extensión
 * explícita para resolver módulos relativos — por eso en runtime tronaba
 * con ERR_MODULE_NOT_FOUND buscando "/var/task/server/app" a secas.
 *
 * Se empaqueta la función a mano: todo el árbol de server/ y shared/ queda
 * inline en un solo archivo (sin imports relativos que resolver en
 * runtime); las dependencias de npm quedan externas, resueltas desde
 * node_modules como en cualquier función Node normal.
 */
await build({
  entryPoints: ["api/index.ts"],
  outfile: "api/_bundle.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log("api/_bundle.js generado");
