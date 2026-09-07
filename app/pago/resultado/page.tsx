"use client";

import dynamic from "next/dynamic";

const PagoResultadoClient = dynamic(() => import("./PagoResultadoClient"), { ssr: false });

export default function Page() {
  return <PagoResultadoClient />;
}
