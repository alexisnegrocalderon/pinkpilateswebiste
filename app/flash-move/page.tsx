import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Flash Move",
  description: "Coreografías sorpresa para celebraciones especiales, hechas a medida por Pink Pilates.",
};

export default function FlashMovePage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Flash Move
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Sorprende con una celebración especial</p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16 text-center">
          <p className="text-[16px] leading-relaxed text-neutral-700">
            ¿Quieres sorprender a tus amigos y familia en una celebración especial? Creamos una
            coreografía con tus canciones favoritas, a cualquier ritmo, con elementos de
            producción teatral. Ideal para matrimonios y celebraciones donde amigos y familia
            quieren participar creando un momento memorable.
          </p>

          <a
            href="/contacto"
            className="mt-8 inline-block rounded-full bg-[#FF5C89] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-[#e14c76]"
          >
            Cotizar mi Flash Move
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
