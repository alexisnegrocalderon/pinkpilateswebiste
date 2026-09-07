import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { classTypes } from "@shared/schema";
import { DISCIPLINA, NIVEL, clp } from "@/lib/format";
import { db } from "../../../server/db/client";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";

export const revalidate = 3600;

async function getClase(slug: string) {
  const [c] = await db.select().from(classTypes).where(eq(classTypes.slug, slug)).limit(1);
  return c ?? null;
}

export async function generateStaticParams() {
  const rows = await db
    .select({ slug: classTypes.slug })
    .from(classTypes)
    .where(and(eq(classTypes.isActive, true), eq(classTypes.isPublic, true)))
    .orderBy(asc(classTypes.sortOrder));
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getClase(slug);
  if (!c) return { title: "Clase no encontrada" };
  return {
    title: c.name,
    description: c.shortDescription ?? c.description?.slice(0, 155) ?? `${c.name} en Pink Pilates, Reñaca.`,
  };
}

export default async function ClaseDetalle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getClase(slug);
  if (!c || !c.isActive || !c.isPublic) notFound();

  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <Link href="/clases" className="text-[13.5px] font-medium text-neutral-500 hover:text-[#FF5C89]">
            ← Todos los tipos de clase
          </Link>

          <span className="mt-6 block w-fit rounded-full bg-[#FFDBDB] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#B4285A]">
            {DISCIPLINA[c.discipline] ?? c.discipline}
          </span>
          <h1 className="mt-4 text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">{c.name}</h1>
          {c.shortDescription && <p className="mt-3 text-[16px] text-neutral-600">{c.shortDescription}</p>}

          <div className="mt-8 flex flex-wrap gap-6 border-y border-neutral-200 py-5 text-[14px] text-neutral-700">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Duración</div>
              <div className="mt-1 font-medium">{c.defaultDurationMin} minutos</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Nivel</div>
              <div className="mt-1 font-medium">{NIVEL[c.level] ?? c.level}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Cupo</div>
              <div className="mt-1 font-medium">{c.defaultCapacity} personas</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Clase suelta</div>
              <div className="mt-1 font-medium">{clp(c.dropInPriceClp)}</div>
            </div>
          </div>

          {c.description && (
            <div className="mt-8 whitespace-pre-line text-[15px] leading-relaxed text-neutral-700">{c.description}</div>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/planes"
              className="rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#e14c76]"
            >
              Ver planes y comprar
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
