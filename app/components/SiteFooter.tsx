import Image from "next/image";
import Link from "next/link";
import { STUDIO } from "@shared/domain/policy";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-[#FF5C89]/20 bg-[#FFDBDB]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 py-14 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2.5">
            <Image src="/assets/pink/pink-pilates-isotipo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-[16px] uppercase tracking-tight text-neutral-900 [font-family:var(--font-display)]">Pink Pilates</span>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-500">{STUDIO.address}</p>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Estudio</div>
          <ul className="mt-3 space-y-2 text-[14px] text-neutral-600">
            <li><Link href="/clases" className="hover:text-[#FF5C89]">Tipos de clase</Link></li>
            <li><Link href="/planes" className="hover:text-[#FF5C89]">Planes y precios</Link></li>
            <li><Link href="/quienes-somos" className="hover:text-[#FF5C89]">Quiénes somos</Link></li>
            <li><Link href="/reglamento" className="hover:text-[#FF5C89]">Reglamento</Link></li>
            <li><Link href="/galeria" className="hover:text-[#FF5C89]">Galería</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Servicios</div>
          <ul className="mt-3 space-y-2 text-[14px] text-neutral-600">
            <li><Link href="/que-es-pilates" className="hover:text-[#FF5C89]">¿Qué es Pilates?</Link></li>
            <li><Link href="/horarios" className="hover:text-[#FF5C89]">Horarios</Link></li>
            <li><Link href="/formacion-instructores" className="hover:text-[#FF5C89]">Formación de instructoras</Link></li>
            <li><Link href="/clases/vals-novios" className="hover:text-[#FF5C89]">Vals novios</Link></li>
            <li><Link href="/flash-move" className="hover:text-[#FF5C89]">Flash Move</Link></li>
            <li><Link href="/animacion-y-eventos" className="hover:text-[#FF5C89]">Animación y eventos</Link></li>
            <li><Link href="/convenios" className="hover:text-[#FF5C89]">Convenios</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Contacto</div>
          <ul className="mt-3 space-y-2 text-[14px] text-neutral-600">
            <li><Link href="/contacto" className="hover:text-[#FF5C89]">Escríbenos</Link></li>
            <li>
              <a href={`https://wa.me/${STUDIO.phone.replace("+", "")}`} className="hover:text-[#FF5C89]">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${STUDIO.email}`} className="hover:text-[#FF5C89]">
                {STUDIO.email}
              </a>
            </li>
            <li>
              <a
                href={`https://instagram.com/${STUDIO.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#FF5C89]"
              >
                Instagram {STUDIO.instagram}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#FF5C89]/15 px-5 py-5 text-center text-[12px] text-neutral-500">
        © {new Date().getFullYear()} Pink Pilates.
      </div>
    </footer>
  );
}
