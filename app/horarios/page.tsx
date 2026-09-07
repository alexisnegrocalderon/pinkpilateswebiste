import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { HorarioTable } from "./HorarioTable";

export const metadata: Metadata = {
  title: "Horarios",
  description: "Horario de clases de Pilates en Pink Pilates, Reñaca — Mat, Reformer, Barré y Baile Entretenido toda la semana.",
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

        <div className="mx-auto max-w-3xl px-5 pb-24">
          <HorarioTable />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
