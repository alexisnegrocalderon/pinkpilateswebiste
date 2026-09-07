import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Convenios",
  description: "Alianzas y descuentos para alumnas de Pink Pilates con otros negocios de Reñaca y Viña del Mar.",
};

const CONVENIOS = [
  {
    nombre: "Studio Alves Pilates",
    detalle: "Programas de formación práctica.",
    contacto: "+569 9284 1621",
    web: "www.alvespilates.cl",
  },
  {
    nombre: "Gloria Codina Machiavello",
    detalle: "Terapia de biomagnetismo y flores de Bach.",
    contacto: "+569 7650 1344",
  },
  {
    nombre: "Smart Odontología",
    detalle: "30% de descuento en limpiezas y blanqueamiento dental.",
    web: "www.smartodontologia.cl",
  },
  {
    nombre: "Sofía Cabello — Nutricionista",
    detalle: "Nutrición integrativa y funcional. 15% de descuento para alumnas.",
    contacto: "+569 8121 0710",
    instagram: "@Nutricionista.sofic",
  },
  {
    nombre: "Agua Natural de Vertiente",
    detalle: "Código de descuento en packs de bienvenida.",
    web: "www.lascañitas.cl",
    instagram: "@lascañitas",
  },
];

export default function ConveniosPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <section className="bg-[#FFF5F5] px-5 pb-10 pt-16 text-center sm:pt-20">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Convenios
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">
            Los beneficios de formar parte de nuestra familia Pink Pilates
          </p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          <div className="grid gap-4">
            {CONVENIOS.map((c) => (
              <div key={c.nombre} className="rounded-2xl border border-neutral-200 p-5">
                <h2 className="text-[16px] font-semibold text-neutral-900">{c.nombre}</h2>
                <p className="mt-1 text-[14px] text-neutral-600">{c.detalle}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-neutral-500">
                  {c.contacto && <span>{c.contacto}</span>}
                  {c.web && <span>{c.web}</span>}
                  {c.instagram && <span>{c.instagram}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
