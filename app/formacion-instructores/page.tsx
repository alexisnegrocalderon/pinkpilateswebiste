import type { Metadata } from "next";
import { Check } from "lucide-react";
import { clp } from "@/lib/format";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Formación de instructoras",
  description: "Formación de instructoras de Pilates Alves Pilates Chile, dictada en Pink Pilates, Reñaca.",
};

const MODULOS = [
  "Fundamentos del Pilates: historia, principios y Mat básico",
  "Mat original: los 34 ejercicios",
  "Aplicaciones terapéuticas",
  "Técnica de Reformer",
  "Wall Unit",
  "Aparatos adicionales: Chair, Ladder Barrel y más",
];

const PRECIOS = [
  { item: "Matrícula (única vez)", monto: 45000 },
  { item: "Cada módulo (5 de 6)", monto: 350000 },
  { item: "Módulo de Reformer", monto: 450000 },
  { item: "Examen de certificación", monto: 25000 },
];

export default function FormacionInstructoresPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Formación de instructoras
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">
            Certificación oficial Alves Pilates, dictada en Pink Pilates
          </p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          <p className="text-[16px] leading-relaxed text-neutral-700">
            Pink Pilates es la sede certificadora de <b>Alves Pilates</b> en Viña del Mar — la
            academia de Pilates más grande de Sudamérica. El programa dura de 1 a 3 años, con 6
            módulos flexibles, dictados sábados y domingos de 9:00 a 18:00 hrs, de forma
            presencial en Viña del Mar más sesiones guiadas por Zoom con Sandro Alves (con
            grabación disponible).
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">Los 6 módulos</h2>
          <ul className="mt-3 grid gap-2">
            {MODULOS.map((m, i) => (
              <li key={m} className="flex items-start gap-2 text-[14.5px] leading-relaxed text-neutral-600">
                <Check size={16} className="mt-0.5 shrink-0 text-[#FF5C89]" />
                <span><b>{i + 1}.</b> {m}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">Certificación</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            Fase I (Mat): módulos 1 a 3 + 122 horas de práctica. Fase II (Aparatos): módulos 4 a
            6 + 122 horas de práctica. La certificación internacional requiere 450 horas totales.
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">Valores</h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200">
            {PRECIOS.map((p, i) => (
              <div
                key={p.item}
                className={`flex items-center justify-between px-4 py-3 text-[14px] ${i > 0 ? "border-t border-neutral-100" : ""}`}
              >
                <span className="text-neutral-700">{p.item}</span>
                <span className="font-semibold text-neutral-900">{clp(p.monto)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-neutral-500">Total de los 6 módulos: {clp(2100000)}.</p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">A quién está dirigido</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            Personas que ya practican Pilates y quieren dar el salto a enseñarlo, o instructoras
            de otras disciplinas que buscan certificarse en Reformer.
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">Cómo inscribirte</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            Escríbenos a{" "}
            <a href="mailto:cursos@alvespilates.com" className="font-medium text-[#FF5C89] hover:underline">
              cursos@alvespilates.com
            </a>{" "}
            o desde el{" "}
            <a href="/contacto" className="font-medium text-[#FF5C89] hover:underline">
              formulario de contacto
            </a>{" "}
            y te contamos las próximas fechas y cupos.
          </p>
          <p className="mt-6 text-[14px] text-neutral-500">Sede de formación: General Carrera 637, Reñaca, Viña del Mar.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
