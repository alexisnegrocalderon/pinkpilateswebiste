import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Galería",
  description: "Fotos del estudio Pink Pilates en Reñaca, Viña del Mar.",
};

// Placeholder con las fotos/video reales que ya tenemos — se completa
// cuando lleguen más fotos del estudio.
const FOTOS = [
  { src: "/assets/pink/studio/reformers-1-xl.jpg", alt: "Sala de reformers de Pink Pilates" },
  { src: "/assets/pink/studio/heart-pan-poster.jpg", alt: "Letrero de neón Pink Pilates" },
  { src: "/assets/pink/studio/reformers-tracking-poster.jpg", alt: "Reformers junto a la ventana" },
];

export default function GaleriaPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Galería
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">El estudio, tal cual es</p>
        </section>

        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {FOTOS.map((f) => (
              <div key={f.src} className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
                <Image src={f.src} alt={f.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
