"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

const OCULTAR_EN = ["/planes", "/comprar", "/pagar", "/pago", "/admin", "/ingresar"];

export function FloatingCta() {
  const pathname = usePathname();
  if (OCULTAR_EN.some((p) => pathname.startsWith(p))) return null;

  return (
    <Link
      href="/planes"
      className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full border border-white/40 bg-[#FF5C89]/80 px-5 py-3.5 text-[13.5px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#FF5C89]/30 backdrop-blur-md transition-all hover:scale-105 hover:bg-[#FF5C89]/95"
    >
      <Heart size={16} className="fill-white text-white" />
      Quiero mi plan
    </Link>
  );
}
