"use client";

import dynamic from "next/dynamic";

// PagoResultado.tsx lee window.location.search directo al montar (fuera de
// un efecto), así que ni siquiera el prerender estático de Next lo tolera.
const PagoResultadoApp = dynamic(() => import("./PagoResultadoApp"), { ssr: false });

export default function Page() {
  return <PagoResultadoApp />;
}
