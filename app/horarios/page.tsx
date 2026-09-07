import type { Metadata } from "next";
import { CROSSHERO_URL } from "@shared/domain/policy";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Horarios",
  description: "Horarios de clases de Pilates en Pink Pilates, Reñaca. Reserva tu cupo directo en CrossHero.",
};

export default function HorariosPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#FFF5F5]">
        <section className="relative overflow-hidden px-5 pb-6 pt-16 sm:pt-20">
          <div className="relative mx-auto max-w-2xl text-center">
            <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
              Horarios
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Conoce nuestros horarios</p>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-5 pb-24">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-[15px] leading-relaxed text-neutral-700">
              Tenemos clases de Pilates Mat, Pilates con aparatos, Pilates para embarazadas, Barré
              y Baile Entretenido a lo largo de toda la semana. El horario y los cupos exactos de
              cada clase se ven en tiempo real en CrossHero.
            </p>
            <p className="mt-4 text-[13.5px] text-neutral-500">
              Los horarios se abren con un mínimo de 3 alumnas inscritas por sesión.
            </p>

            <a
              href={CROSSHERO_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-full bg-[#FF5C89] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-[#e14c76]"
            >
              Ver horario y cupos en CrossHero
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
