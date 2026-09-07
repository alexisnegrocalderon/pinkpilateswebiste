"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

const OCULTAR_EN = ["/planes", "/comprar", "/pagar", "/pago", "/admin", "/ingresar"];

export function FloatingCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    let ticking = false;
    const checar = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(checar);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    checar();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (OCULTAR_EN.some((p) => pathname.startsWith(p))) return null;

  return (
    <Link
      href="/planes"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full border border-white/40 bg-[#FF5C89]/80 px-5 py-3.5 text-[13.5px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#FF5C89]/30 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-[#FF5C89]/95 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <Heart size={16} className="fill-white text-white" />
      Quiero mi plan
    </Link>
  );
}
