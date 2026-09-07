import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";

const HECHOS = ["5 reformers", "Clases reducidas", "Angamos 326, Reñaca", "Créditos flexibles"];

const EQUIPO = ["Reformer", "Wall Unit", "Chair", "Ladder Barrel", "Spine Corrector", "Mat"];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative flex h-[88vh] min-h-[560px] items-end overflow-hidden bg-neutral-900">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/assets/pink/studio/reformers-tracking.mp4"
            poster="/assets/pink/studio/reformers-tracking-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />

          <div className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-32">
            <h1 className="max-w-2xl text-[40px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[56px]">
              Pilates Reformer en Reñaca
            </h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/80">
              Estudio boutique con clases reducidas y equipamiento profesional. Reserva por créditos, a tu ritmo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/reservar"
                className="rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-neutral-900 transition-transform hover:scale-[1.03]"
              >
                Reservar clase de prueba
              </Link>
              <Link
                href="/planes"
                className="rounded-full border border-white/40 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </section>

        {/* Franja de hechos */}
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center sm:grid-cols-4">
            {HECHOS.map((h) => (
              <div key={h} className="text-[13.5px] font-medium text-neutral-500">
                {h}
              </div>
            ))}
          </div>
        </section>

        {/* Estudio + equipamiento */}
        <section id="clases" className="mx-auto max-w-6xl px-5 py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
            <div className="overflow-hidden rounded-2xl">
              <Image
                src="/assets/pink/studio/reformers-1.jpg"
                alt="Sala de reformers de Pink Pilates, Reñaca"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#FF5C89]">El estudio</div>
              <h2 className="mt-3 text-[28px] font-semibold leading-tight text-neutral-900 sm:text-[34px]">
                Equipamiento real, clases pequeñas
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
                Trabajamos con reformer, wall unit, chair, ladder barrel, spine corrector y mat — el equipamiento
                completo del método Pilates, en un espacio pensado para pocas personas por clase.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {EQUIPO.map((e) => (
                  <li key={e} className="rounded-full bg-neutral-100 px-3.5 py-1.5 text-[13px] font-medium text-neutral-700">
                    {e}
                  </li>
                ))}
              </ul>
              <Link
                href="/planes"
                className="mt-8 inline-block rounded-full bg-neutral-900 px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#FF5C89]"
              >
                Ver planes y precios
              </Link>
            </div>
          </div>
        </section>

        {/* Banda de marca */}
        <section className="relative flex h-[52vh] min-h-[380px] items-center justify-center overflow-hidden bg-neutral-900">
          <video
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            src="/assets/pink/studio/heart-pan.mp4"
            poster="/assets/pink/studio/heart-pan-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/70">Pink, Unleashed</p>
            <a
              href="https://instagram.com/pinkpilates"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[15px] font-medium text-white underline underline-offset-4 hover:text-[#FFDBE3]"
            >
              Síguenos en Instagram
            </a>
          </div>
        </section>

        {/* CTA final */}
        <section className="mx-auto max-w-6xl px-5 py-24 text-center">
          <h2 className="text-[26px] font-semibold text-neutral-900 sm:text-[32px]">¿Lista para tu primera clase?</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">
            Reserva tu clase de prueba o revisa los planes y elige el que mejor calce contigo.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/reservar"
              className="rounded-full bg-neutral-900 px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#FF5C89]"
            >
              Reservar clase
            </Link>
            <Link
              href="/planes"
              className="rounded-full border border-neutral-300 px-6 py-3 text-[14px] font-semibold text-neutral-800 hover:border-neutral-900"
            >
              Ver planes
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
