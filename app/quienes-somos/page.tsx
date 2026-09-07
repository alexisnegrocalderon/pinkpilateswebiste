import type { Metadata } from "next";
import Link from "next/link";
import { CROSSHERO_URL } from "@shared/domain/policy";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: "La historia de Javiera De La Torre y la misión de Pink Pilates, estudio boutique de Pilates en Reñaca, Viña del Mar.",
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
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Pink es la energía del amor en movimiento</p>
        </section>

        <div className="mx-auto max-w-2xl px-5 py-16">
          <p className="text-[16px] leading-relaxed text-neutral-700">
            Pink nace con una misión clara y profunda: ofrecer un servicio de fitness único e
            integral que va más allá del ejercicio. Queremos engrandecer el alma a través del
            movimiento consciente, logrando como resultado un cuerpo sano, armonioso y
            verdaderamente feliz. Cada clase es una invitación a conectarte contigo misma:
            fortalecerte desde adentro, liberar tensiones, ganar confianza y fluir con más
            ligereza en tu día a día. Con más de 11 años en el corazón de Reñaca, hemos creado un
            espacio donde el bienestar se vive con cariño, atención personalizada y una comunidad
            que se siente como familia.
          </p>

          <h2 className="mt-10 text-[22px] font-semibold text-neutral-900">La fundadora</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            Javiera Andrea De La Torre Vio es el alma detrás de Pink Pilates. Comenzó estudiando
            Teatro en 2002, y con los años se certificó como Personal Trainer, instructora de
            Baile Entretenido y Danza Árabe. Después de años enseñando fitness, descubrió el
            método Pilates de la mano de Sandro Alves (Alves Pilates), quien la formó como Teacher
            Trainer. En 2014 fundó "Pink, fitness&Dance", y el 2 de febrero de 2015 abrió
            oficialmente Pink Pilates Studio en su ubicación actual.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-neutral-600">
            Hoy es Directora y Creadora de Pink Pilates, Teacher Trainer Chile de Alves Pilates
            —la academia de Pilates más grande de Sudamérica—, y acumula certificaciones en Mat
            Pilates, Reformer, Chair, Ladder Barrel y Spine Corrector, además de sus títulos de
            actriz, personal trainer e instructora de baile.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={CROSSHERO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#e14c76]"
            >
              Reservar en CrossHero
            </a>
            <Link
              href="/clases"
              className="rounded-full border border-neutral-300 px-6 py-3 text-[14px] font-semibold text-neutral-800 hover:border-[#FF5C89] hover:text-[#FF5C89]"
            >
              Ver tipos de clase
            </Link>
            <Link
              href="/que-es-pilates"
              className="rounded-full border border-neutral-300 px-6 py-3 text-[14px] font-semibold text-neutral-800 hover:border-[#FF5C89] hover:text-[#FF5C89]"
            >
              ¿Qué es Pilates?
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
