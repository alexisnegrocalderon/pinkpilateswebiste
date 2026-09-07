import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { classTypes } from "@shared/schema";
import { DISCIPLINA, NIVEL } from "@/lib/format";
import { db } from "../../server/db/client";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Tipos de clase",
  description: "Reformer, Wall Unit, Mat y más — conoce cada tipo de clase de Pink Pilates en Reñaca, con su descripción, duración y nivel.",
};

export const revalidate = 3600;

export default async function ClasesPage() {
  const clases = await db
    .select()
    .from(classTypes)
    .where(and(eq(classTypes.isActive, true), eq(classTypes.isPublic, true)))
    .orderBy(asc(classTypes.sortOrder));

  return (
    <>
      <SiteHeader />
      <main className="bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h1 className="text-[32px] font-semibold tracking-tight text-neutral-900 sm:text-[40px]">Tipos de clase</h1>
          <p className="mt-2 max-w-xl text-[15px] text-neutral-600">
            Cada clase dura {clases[0]?.defaultDurationMin ?? 60} minutos y se paga con créditos de tu plan.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clases.map((c) => (
              <Link
                key={c.id}
                href={`/clases/${c.slug}`}
                className="group flex flex-col rounded-2xl border border-neutral-200 p-6 transition-colors hover:border-[#FF5C89]"
              >
                <span className="w-fit rounded-full bg-[#FFDBDB] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#B4285A]">
                  {DISCIPLINA[c.discipline] ?? c.discipline}
                </span>
                <h2 className="mt-4 text-[19px] font-semibold text-neutral-900 group-hover:text-[#FF5C89]">{c.name}</h2>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-neutral-600">
                  {c.shortDescription ?? c.description?.slice(0, 120) ?? ""}
                </p>
                <div className="mt-4 flex items-center justify-between text-[13px] text-neutral-500">
                  <span>{NIVEL[c.level] ?? c.level}</span>
                  <span>{c.defaultDurationMin} min</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
