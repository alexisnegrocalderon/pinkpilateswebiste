"use client";

import dynamic from "next/dynamic";

const PagoMockApp = dynamic(() => import("./PagoMockApp"), { ssr: false });

export default function Page() {
  return <PagoMockApp />;
}
