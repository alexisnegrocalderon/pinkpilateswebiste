import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "¿Qué es Pilates?",
  description: "La historia del método Pilates, el Reformer y sus beneficios reales, explicados por Pink Pilates.",
};

const BENEFICIOS = [
  "Fortalece y tonifica el cuerpo sin aumentar el volumen muscular, estilizando la figura.",
  "Mejora la postura y corrige malos hábitos posturales.",
  "Aumenta la flexibilidad, la agilidad y el equilibrio.",
  "Mejora la coordinación y el control de los movimientos.",
  "Previene y ayuda a rehabilitar lesiones del sistema músculo-esquelético.",
  "Reduce el estrés y las tensiones musculares a través de la respiración y la concentración.",
  "Aporta vitalidad, fuerza y mayor conciencia corporal.",
  "Fortalece el core, base de un movimiento eficiente y seguro.",
];

export default function QueEsPilatesPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            ¿Qué es Pilates?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] italic text-neutral-600">
            "La completa coordinación entre la mente, el cuerpo y el espíritu" — Joseph Pilates
          </p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          <p className="text-[16px] leading-relaxed text-neutral-700">
            Joseph Pilates desarrolló su método durante la Primera Guerra Mundial, mientras
            estaba internado en un campo de prisioneros en Inglaterra, aplicando ejercicios junto
            a otros prisioneros para mantener la salud y combatir las enfermedades del
            hacinamiento. Después de la guerra perfeccionó la técnica en Alemania, enfocándose en
            rehabilitar veteranos con distintas discapacidades — con resultados tan notables que
            los médicos de la época reconocieron esta rehabilitación basada en Pilates como más
            rápida, efectiva e integral que los tratamientos tradicionales.
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">El Reformer: el corazón del método</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            El Reformer es uno de los aparatos más completos que creó Joseph Pilates: una
            plataforma con un carro deslizante que usa resortes y poleas para dar una resistencia
            variable y progresiva, permitiendo cientos de ejercicios con más control, precisión y
            seguridad. A diferencia de los gimnasios que empiezan en el suelo, el Pilates clásico
            recomienda partir en el Reformer, que integra pies, cuádriceps, abdomen, columna y
            hombros mientras mejora fuerza, flexibilidad y tono muscular.
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">¿Por qué es tan efectivo?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
            El Reformer combina fortalecimiento y estiramiento en el mismo movimiento; los
            resortes acompañan al músculo durante las fases de contracción y relajación para un
            trabajo más profundo, seguro y eficiente. La guía de la instructora asegura la
            alineación correcta y protege las articulaciones.
          </p>

          <h2 className="mt-10 text-[19px] font-semibold text-neutral-900">Beneficios del método Pilates</h2>
          <ul className="mt-3 grid gap-2">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[14.5px] leading-relaxed text-neutral-600">
                <Check size={16} className="mt-0.5 shrink-0 text-[#FF5C89]" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-[15px] leading-relaxed text-neutral-700">
            En Pink Pilates creemos que el Pilates es mucho más que ejercicio: es una forma
            inteligente de moverte, cuidarte y conectar contigo misma.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/planes"
              className="rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#e14c76]"
            >
              Comprar un plan
            </Link>
            <Link
              href="/clases"
              className="rounded-full border border-neutral-300 px-6 py-3 text-[14px] font-semibold text-neutral-800 hover:border-[#FF5C89] hover:text-[#FF5C89]"
            >
              Ver tipos de clase
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
