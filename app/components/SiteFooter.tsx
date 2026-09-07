import Image from "next/image";
import Link from "next/link";
import { STUDIO } from "@shared/domain/policy";

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-[#FFDBDB] bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Image src="/assets/pink/pink-pilates-isotipo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
            <span className="text-[15px] font-semibold text-neutral-900">Pink Pilates</span>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-500">{STUDIO.address}</p>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Estudio</div>
          <ul className="mt-3 space-y-2 text-[14px] text-neutral-600">
            <li><Link href="/clases" className="hover:text-[#FF5C89]">Tipos de clase</Link></li>
            <li><Link href="/planes" className="hover:text-[#FF5C89]">Planes y precios</Link></li>
            <li><Link href="/reservar" className="hover:text-[#FF5C89]">Reservar clase</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Contacto</div>
          <ul className="mt-3 space-y-2 text-[14px] text-neutral-600">
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

      <div className="border-t border-neutral-100 px-5 py-5 text-center text-[12px] text-neutral-400">
        © {new Date().getFullYear()} Pink Pilates.
      </div>
    </footer>
  );
}
