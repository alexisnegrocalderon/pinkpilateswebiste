import type { Metadata } from "next";
import { CROSSHERO_URL } from "@shared/domain/policy";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Horarios",
  description: "Horarios de clases de Pilates Reformer en Pink Pilates, Reñaca. Reserva tu cupo directo en CrossHero.",
};

const DIAS = [
  { dia: "Lunes", franjas: "08:00 · 09:00 · 10:00 · 18:00 · 19:00" },
  { dia: "Martes", franjas: "09:00 · 10:00 · 17:00 · 18:00 · 19:00" },
  { dia: "Miércoles", franjas: "08:00 · 09:00 · 10:00 · 18:00 · 19:00" },
  { dia: "Jueves", franjas: "09:00 · 10:00 · 17:00 · 18:00 · 19:00" },
  { dia: "Viernes", franjas: "08:00 · 09:00 · 10:00 · 17:00" },
  { dia: "Sábado", franjas: "10:00 · 11:00" },
];

export default function HorariosPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#FFF5F5]">
        <section className="relative overflow-hidden px-5 pb-6 pt-16 sm:pt-20">
          <div className="relative mx-auto max-w-3xl text-center">
            <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
              Horarios
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">
              Referencia general — el horario exacto y los cupos disponibles se ven y se reservan en CrossHero.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5 pb-24">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            {DIAS.map((d, i) => (
              <div
                key={d.dia}
                className={`flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between ${i > 0 ? "border-t border-neutral-100" : ""}`}
              >
                <span className="text-[14px] font-semibold uppercase tracking-wide text-neutral-900">{d.dia}</span>
                <span className="text-[14px] text-neutral-600">{d.franjas}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href={CROSSHERO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full bg-[#FF5C89] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-[#e14c76]"
            >
              Ver cupos y reservar en CrossHero
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
