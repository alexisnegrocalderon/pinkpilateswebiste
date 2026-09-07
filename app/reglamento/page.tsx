import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Reglamento",
  description: "Reglamento y políticas de clases, reservas y planes de Pink Pilates.",
};

const SECCIONES = [
  {
    titulo: "Reservas y cancelaciones",
    texto:
      "[Placeholder] Las reservas se hacen a través de CrossHero. Te pedimos cancelar con anticipación para liberar el cupo a otra alumna.",
  },
  {
    titulo: "Puntualidad",
    texto:
      "[Placeholder] Te recomendamos llegar 10 minutos antes de tu clase. Por seguridad, no se puede ingresar una vez iniciada la sesión.",
  },
  {
    titulo: "Planes y vigencia",
    texto:
      "[Placeholder] Cada plan tiene una cantidad de créditos y una vigencia definida — el detalle de cada uno está en la página de Planes.",
  },
  {
    titulo: "Salud y seguridad",
    texto:
      "[Placeholder] Avísanos si tienes alguna lesión, estás embarazada o tienes alguna condición que debamos considerar antes de tu clase.",
  },
];

export default function ReglamentoPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Reglamento
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Lo que hay que saber antes de tu primera clase</p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          {SECCIONES.map((s) => (
            <div key={s.titulo} className="mb-10">
              <h2 className="text-[19px] font-semibold text-neutral-900">{s.titulo}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{s.texto}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
