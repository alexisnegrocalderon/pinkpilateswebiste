"use client";

import dynamic from "next/dynamic";

const PagoMockClient = dynamic(() => import("./PagoMockClient"), { ssr: false });

export default function Page() {
  return <PagoMockClient />;
}
