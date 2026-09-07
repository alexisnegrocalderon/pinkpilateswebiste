import type { Metadata } from "next";
import { STUDIO } from "@shared/domain/policy";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Formación de instructoras",
  description: "Programa de formación de instructoras de Pilates Reformer en Pink Pilates, Reñaca.",
};

export default function FormacionInstructoresPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Formación de instructoras
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Aprende a enseñar Pilates Reformer</p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          <p className="text-[16px] leading-relaxed text-neutral-700">
            [Contenido pendiente] Pink Pilates forma a nuevas instructoras de Pilates Reformer, con
            clases teóricas y práctica supervisada en el mismo estudio, usando el equipamiento real
            con el que después van a trabajar.
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">A quién está dirigido</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            [Placeholder] Personas que ya practican Pilates y quieren dar el salto a enseñarlo,
            o instructoras de otras disciplinas que buscan certificarse en Reformer.
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">Cómo inscribirte</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            Escríbenos por WhatsApp o desde el{" "}
            <a href="/contacto" className="font-medium text-[#FF5C89] hover:underline">
              formulario de contacto
            </a>{" "}
            y te contamos las próximas fechas y cupos.
          </p>
          <p className="mt-6 text-[14px] text-neutral-500">{STUDIO.address}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
