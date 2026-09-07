"use client";

import dynamic from "next/dynamic";

// ssr:false: transaccional, detrás de una orden creada en el momento, sin
// valor de SEO (ver robots.ts). Checkout.tsx usa wouter (useRoute) que
// necesita `window`, y no hay nada que ganar prerenderizándola.
const CheckoutApp = dynamic(() => import("./CheckoutApp"), { ssr: false });

export default function Page() {
  return <CheckoutApp />;
}
