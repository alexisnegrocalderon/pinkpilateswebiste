"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const CLASES = [
  { href: "/clases/studio-pilates", label: "Studio Pilates" },
  { href: "/clases/wall-chair", label: "Wall Unit & Chair" },
  { href: "/clases/mat-pilates", label: "Mat Pilates" },
  { href: "/clases/barre", label: "Barré" },
  { href: "/clases/baile-entretenido", label: "Baile Entretenido" },
  { href: "/clases/pilates-embarazo", label: "Pilates Embarazo" },
  { href: "/clases/adulto-mayor", label: "Pilates Adulto Mayor" },
  { href: "/clases/vals-novios", label: "Vals Novios" },
];

const NOSOTROS = [
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/que-es-pilates", label: "¿Qué es Pilates?" },
  { href: "/formacion-instructores", label: "Formación de instructoras" },
];

const MAS = [
  { href: "/convenios", label: "Convenios" },
  { href: "/flash-move", label: "Flash Move" },
  { href: "/animacion-y-eventos", label: "Animación y eventos" },
  { href: "/galeria", label: "Galería" },
];

const dropdownLinkClass =
  "block rounded-lg px-3 py-2 text-[13.5px] font-medium text-neutral-700 hover:bg-[#FFDBDB] hover:text-[#B4285A]";

export function SiteHeader() {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setAbierto(false)}>
          <Image src="/assets/pink/pink-pilates-isotipo.png" alt="" width={32} height={32} priority className="h-8 w-8 object-contain" />
          <span className="text-[16px] uppercase tracking-tight text-neutral-900 [font-family:var(--font-display)]">Pink Pilates</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto bg-transparent px-3 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-neutral-600 hover:bg-transparent hover:text-[#FF5C89] data-[state=open]:bg-transparent data-[state=open]:text-[#FF5C89]">
                  Clases
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[240px] gap-0.5 p-2">
                    {CLASES.map((c) => (
                      <NavigationMenuLink key={c.href} asChild>
                        <Link href={c.href} className={dropdownLinkClass}>
                          {c.label}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    <NavigationMenuLink asChild>
                      <Link href="/clases" className={`${dropdownLinkClass} mt-1 border-t border-neutral-100 pt-2.5 text-[#FF5C89]`}>
                        Ver todas las clases →
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/horarios"
                  className="inline-flex h-auto items-center px-3 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-neutral-600 transition-colors hover:text-[#FF5C89]"
                >
                  Horarios
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/planes"
                  className="inline-flex h-auto items-center px-3 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-neutral-600 transition-colors hover:text-[#FF5C89]"
                >
                  Planes
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto bg-transparent px-3 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-neutral-600 hover:bg-transparent hover:text-[#FF5C89] data-[state=open]:bg-transparent data-[state=open]:text-[#FF5C89]">
                  Nosotros
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[220px] gap-0.5 p-2">
                    {NOSOTROS.map((n) => (
                      <NavigationMenuLink key={n.href} asChild>
                        <Link href={n.href} className={dropdownLinkClass}>
                          {n.label}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto bg-transparent px-3 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-neutral-600 hover:bg-transparent hover:text-[#FF5C89] data-[state=open]:bg-transparent data-[state=open]:text-[#FF5C89]">
                  Más
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[220px] gap-0.5 p-2">
                    {MAS.map((m) => (
                      <NavigationMenuLink key={m.href} asChild>
                        <Link href={m.href} className={dropdownLinkClass}>
                          {m.label}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/contacto"
                  className="inline-flex h-auto items-center px-3 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-neutral-600 transition-colors hover:text-[#FF5C89]"
                >
                  Contacto
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Link
            href="/planes"
            className="ml-3 rounded-full bg-[#FF5C89] px-5 py-2 text-[13px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#e14c76]"
          >
            Comprar plan
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
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="clases" className="border-none">
              <AccordionTrigger className="rounded-lg px-3 py-2.5 text-[15px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-[#FFDBDB] hover:no-underline">
                Clases
              </AccordionTrigger>
              <AccordionContent className="pl-3">
                <div className="grid gap-0.5">
                  {CLASES.map((c) => (
                    <Link key={c.href} href={c.href} onClick={() => setAbierto(false)} className={dropdownLinkClass}>
                      {c.label}
                    </Link>
                  ))}
                  <Link href="/clases" onClick={() => setAbierto(false)} className={`${dropdownLinkClass} text-[#FF5C89]`}>
                    Ver todas las clases →
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="nosotros" className="border-none">
              <AccordionTrigger className="rounded-lg px-3 py-2.5 text-[15px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-[#FFDBDB] hover:no-underline">
                Nosotros
              </AccordionTrigger>
              <AccordionContent className="pl-3">
                <div className="grid gap-0.5">
                  {NOSOTROS.map((n) => (
                    <Link key={n.href} href={n.href} onClick={() => setAbierto(false)} className={dropdownLinkClass}>
                      {n.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mas" className="border-none">
              <AccordionTrigger className="rounded-lg px-3 py-2.5 text-[15px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-[#FFDBDB] hover:no-underline">
                Más
              </AccordionTrigger>
              <AccordionContent className="pl-3">
                <div className="grid gap-0.5">
                  {MAS.map((m) => (
                    <Link key={m.href} href={m.href} onClick={() => setAbierto(false)} className={dropdownLinkClass}>
                      {m.label}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Link
            href="/horarios"
            onClick={() => setAbierto(false)}
            className="rounded-lg px-3 py-2.5 text-[15px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-[#FFDBDB]"
          >
            Horarios
          </Link>
          <Link
            href="/planes"
            onClick={() => setAbierto(false)}
            className="rounded-lg px-3 py-2.5 text-[15px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-[#FFDBDB]"
          >
            Planes
          </Link>
          <Link
            href="/contacto"
            onClick={() => setAbierto(false)}
            className="rounded-lg px-3 py-2.5 text-[15px] font-semibold uppercase tracking-wide text-neutral-700 hover:bg-[#FFDBDB]"
          >
            Contacto
          </Link>

          <Link
            href="/planes"
            onClick={() => setAbierto(false)}
            className="mt-1 rounded-full bg-[#FF5C89] px-4 py-2.5 text-center text-[14px] font-semibold uppercase tracking-wide text-white"
          >
            Comprar plan
          </Link>
        </nav>
      )}
    </header>
  );
}
