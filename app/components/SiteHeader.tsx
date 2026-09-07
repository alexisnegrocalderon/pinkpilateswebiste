"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/clases", label: "Clases" },
  { href: "/planes", label: "Planes" },
  { href: "/reservar", label: "Reservar" },
];

export function SiteHeader() {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setAbierto(false)}>
          <Image src="/assets/pink/pink-pilates-isotipo.png" alt="" width={32} height={32} priority className="h-8 w-8 object-contain" />
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900">Pink Pilates</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[14px] font-medium text-neutral-600 transition-colors hover:text-neutral-900">
              {n.label}
            </Link>
          ))}
          <Link
            href="/ingresar"
            className="text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
          >
            Ingresar
          </Link>
          <Link
            href="/reservar"
            className="rounded-full bg-[#FF5C89] px-5 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#e14c76]"
          >
            Reservar clase
          </Link>
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center md:hidden"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          <span className="relative block h-3.5 w-5">
            <span className={`absolute left-0 top-0 h-[1.5px] w-5 bg-neutral-900 transition-transform ${abierto ? "translate-y-[6px] rotate-45" : ""}`} />
            <span className={`absolute left-0 bottom-0 h-[1.5px] w-5 bg-neutral-900 transition-transform ${abierto ? "-translate-y-[6px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      {abierto && (
        <nav className="flex flex-col gap-1 border-t border-neutral-200 bg-white px-5 py-4 md:hidden">
          {[...NAV, { href: "/ingresar", label: "Ingresar" }].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setAbierto(false)}
              className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-neutral-700 hover:bg-[#FFDBDB]"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/reservar"
            onClick={() => setAbierto(false)}
            className="mt-1 rounded-full bg-[#FF5C89] px-4 py-2.5 text-center text-[14px] font-semibold text-white"
          >
            Reservar clase
          </Link>
        </nav>
      )}
    </header>
  );
}
