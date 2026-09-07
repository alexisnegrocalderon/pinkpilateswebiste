"use client";

import dynamic from "next/dynamic";

// ssr:false a propósito: wouter usa `window`/`location` directamente, y esto
// es un panel detrás de login sin ningún valor de SEO — no hace falta
// renderizarlo en el servidor, sólo en el navegador.
const AdminApp = dynamic(() => import("./AdminApp"), { ssr: false });

export default function Page() {
  return <AdminApp />;
}
