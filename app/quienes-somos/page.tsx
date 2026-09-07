import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: "La historia y la misión de Pink Pilates, estudio boutique de Pilates Reformer en Reñaca, Viña del Mar.",
};

export default function QuienesSomosPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Quiénes somos
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Estudio boutique en el corazón de Reñaca</p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          <p className="text-[16px] leading-relaxed text-neutral-700">
            [Contenido pendiente — texto de relleno para que la estructura y el SEO de la página
            queden listos]. Pink Pilates nace de la idea de que moverse bien no tiene por qué ser
            intimidante: un estudio pequeño, cercano, con equipamiento profesional y clases
            reducidas para que cada persona reciba atención real, sin perderse entre veinte
            colchonetas.
          </p>

          <h2 className="mt-10 text-[22px] font-semibold text-neutral-900">Misión</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            [Placeholder] Acompañar a cada alumna en su relación con el movimiento, con clases
            técnicas, seguras y adaptadas a su nivel real — no al de la clase anterior.
          </p>

          <h2 className="mt-10 text-[22px] font-semibold text-neutral-900">Visión</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            [Placeholder] Ser el estudio de Pilates de referencia en Reñaca y Viña del Mar, conocido
            por la calidad de sus instructoras y por lo bien que se siente entrenar acá.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/clases"
              className="rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#e14c76]"
            >
              Ver tipos de clase
            </Link>
            <Link
              href="/formacion-instructores"
              className="rounded-full border border-neutral-300 px-6 py-3 text-[14px] font-semibold text-neutral-800 hover:border-[#FF5C89] hover:text-[#FF5C89]"
            >
              Formación de instructoras
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
