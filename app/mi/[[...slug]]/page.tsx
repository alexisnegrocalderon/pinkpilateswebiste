"use client";

import dynamic from "next/dynamic";

// Mismo motivo que /admin: panel autenticado, sin SEO, wouter necesita `window`.
const MiApp = dynamic(() => import("./MiApp"), { ssr: false });

export default function Page() {
  return <MiApp />;
}
