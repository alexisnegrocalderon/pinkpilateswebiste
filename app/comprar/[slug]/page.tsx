"use client";

import dynamic from "next/dynamic";

// ssr:false: transaccional, sin valor de SEO (ver robots.ts) y depende de
// datos que cambian con cada visita (precio vigente, disponibilidad del plan).
const ComprarClient = dynamic(() => import("./ComprarClient"), { ssr: false });

export default function Page() {
  return <ComprarClient />;
}
