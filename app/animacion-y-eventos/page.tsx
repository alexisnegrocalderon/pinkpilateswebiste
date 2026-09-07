import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Animación y eventos",
  description: "Animación para matrimonios, desfiles de moda y eventos infantiles, por el equipo de Pink Pilates.",
};

const SERVICIOS = ["Matrimonios", "Desfiles de moda", "Animaciones infantiles"];

export default function AnimacionYEventosPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Animación y eventos
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Prepárate para tener el evento que siempre quisiste</p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16 text-center">
          <p className="text-[16px] leading-relaxed text-neutral-700">
            Estilo alegre y elegante, adaptado al lugar y la ocasión, con buena dicción y
            oratoria. Buscamos crear el mejor entretenimiento para todos los invitados, desde los
            más pequeños hasta los más adultos.
          </p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {SERVICIOS.map((s) => (
              <li key={s} className="rounded-full bg-[#FB8CAC] px-4 py-1.5 text-[13px] font-medium text-white">
                {s}
              </li>
            ))}
          </ul>

          <a
            href="/contacto"
            className="mt-8 inline-block rounded-full bg-[#FF5C89] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-[#e14c76]"
          >
            Cotizar mi evento
          </a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
