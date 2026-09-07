import Link from "next/link";
import { STUDIO } from "@shared/domain/policy";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";

const HECHOS = ["5 reformers", "Clases reducidas", "Angamos 326, Reñaca", "Créditos flexibles"];

const EQUIPO = ["Reformer", "Wall Unit", "Chair", "Ladder Barrel", "Spine Corrector", "Mat"];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="bg-[#FFF5F5]">
        {/* Hero — el letrero de neón real del estudio */}
        <section className="relative flex h-[92vh] min-h-[600px] items-end overflow-hidden bg-neutral-900">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/pink/studio/heart-pan.mp4"
            poster="/assets/pink/studio/heart-pan-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/45" />
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FF5C89]/70 blur-2xl sm:h-96 sm:w-96"
          />

          <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-32">
            <span className="inline-block rounded-full bg-[#FF5C89] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
              Estudio boutique · Reñaca
            </span>
            <h1 className="mt-5 max-w-3xl text-[44px] uppercase leading-[0.95] tracking-tight text-white [font-family:var(--font-display)] sm:text-[76px]">
              Pilates Reformer,{" "}
              <span className="text-[#FFB4C8]">a tu ritmo</span>
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/85">
              Estudio boutique con clases reducidas y equipamiento profesional. Reserva por créditos, a tu ritmo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/planes"
                className="rounded-full bg-[#FF5C89] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white transition-transform hover:scale-[1.03]"
              >
                Comprar un plan
              </Link>
              <Link
                href="/clases"
                className="rounded-full border border-white/50 px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
              >
                Ver clases
              </Link>
            </div>
          </div>
        </section>

        {/* Franja de hechos */}
        <section className="bg-[#FF5C89]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center sm:grid-cols-4">
            {HECHOS.map((h) => (
              <div key={h} className="text-[13.5px] font-semibold uppercase tracking-wide text-white">
                {h}
              </div>
            ))}
          </div>
        </section>

        {/* Estudio + equipamiento */}
        <section id="clases" className="mx-auto max-w-6xl px-5 py-28">
          <div className="grid gap-14 md:grid-cols-2 md:items-center md:gap-16">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -left-8 -top-8 hidden h-40 w-40 rounded-full bg-[#FDA8BF] sm:block"
              />
              <div className="relative overflow-hidden rounded-full aspect-square bg-neutral-900 shadow-xl ring-8 ring-white">
                <video
                  className="h-full w-full object-cover"
                  src="/assets/pink/studio/reformers-tracking.mp4"
                  poster="/assets/pink/studio/reformers-tracking-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF5C89]">El estudio</div>
              <h2 className="mt-3 text-[34px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[44px]">
                Equipamiento real,
                <br />
                clases pequeñas
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-neutral-600">
                Trabajamos con reformer, wall unit, chair, ladder barrel, spine corrector y mat — el equipamiento
                completo del método Pilates, en un espacio pensado para pocas personas por clase.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {EQUIPO.map((e) => (
                  <li key={e} className="rounded-full bg-[#FB8CAC] px-3.5 py-1.5 text-[13px] font-medium text-white">
                    {e}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/clases"
                  className="inline-block rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-[#e14c76]"
                >
                  Ver tipos de clase
                </Link>
                <Link
                  href="/planes"
                  className="inline-block rounded-full border border-neutral-300 px-6 py-3 text-[14px] font-semibold uppercase tracking-wide text-neutral-800 hover:border-[#FF5C89] hover:text-[#FF5C89]"
                >
                  Ver planes y precios
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Misión */}
        <section className="bg-[#FFDBDB] px-5 py-20 text-center">
          <p className="mx-auto max-w-xl text-[20px] font-medium italic leading-relaxed text-neutral-800 sm:text-[24px]">
            "La condición física es el primer requisito para la felicidad."
          </p>
          <p className="mt-2 text-[13px] font-semibold uppercase tracking-wide text-[#B4285A]">— Joseph Pilates</p>
          <p className="mx-auto mt-8 max-w-lg text-[15px] leading-relaxed text-neutral-700">
            Pink Pilates nace para entregar a la comunidad sanación a través del movimiento.
            Queremos engrandecer el alma a través del movimiento consciente, logrando como
            resultado un cuerpo sano, armonioso y verdaderamente feliz.
          </p>
        </section>

        {/* Banda de marca */}
        <section className="bg-[#FF5C89] py-16 text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/80">Pink, Unleashed</p>
          <a
            href={`https://instagram.com/${STUDIO.instagram.replace("@", "")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[16px] font-medium text-white underline underline-offset-4 hover:text-[#FFDBE3]"
          >
            Síguenos en Instagram
          </a>
        </section>

        {/* CTA final */}
        <section className="px-5 py-28 text-center">
          <h2 className="text-[30px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[40px]">
            ¿Lista para tu primera clase?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-neutral-600">
            Elige el plan que mejor calce contigo y paga directo desde aquí.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/planes"
              className="rounded-full bg-[#FF5C89] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-[#e14c76]"
            >
              Comprar un plan
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
