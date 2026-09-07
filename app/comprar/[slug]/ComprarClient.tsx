"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { clp } from "@/lib/format";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";

type Plan = { slug: string; name: string; priceClp: number; credits: number; validityDays: number };

export default function ComprarClient() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Plan[]>("/public/plans").then((planes) => setPlan(planes.find((p) => p.slug === slug) ?? null));
  }, [slug]);

  async function comprar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const r = await api.post<{ redirectUrl: string }>("/public/checkout", { planSlug: slug, ...f });
      window.location.href = r.redirectUrl;
    } catch (err) {
      setError((err as Error).message || "No pudimos iniciar la compra. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="bg-[#FFF5F5]">
        <div className="mx-auto max-w-md px-5 py-16">
          <h1 className="text-[30px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)]">
            Comprar plan
          </h1>

          {plan === undefined ? (
            <p className="mt-6 text-[14px] text-neutral-500">Cargando…</p>
          ) : plan === null ? (
            <p className="mt-6 text-[14px] text-neutral-600">Ese plan ya no está disponible.</p>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-[15px] font-semibold text-neutral-900">{plan.name}</p>
                <p className="mt-1 text-[24px] font-bold text-neutral-900">{clp(plan.priceClp)}</p>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  {plan.credits} {plan.credits === 1 ? "clase" : "clases"} · vigencia {plan.validityDays} días
                </p>
              </div>

              <form onSubmit={comprar} className="mt-6 grid gap-4 rounded-2xl bg-white p-6 shadow-sm">
                <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                  Nombre completo
                  <input
                    required
                    className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                    value={f.name}
                    onChange={(e) => setF({ ...f, name: e.target.value })}
                  />
                </label>
                <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                  Email
                  <input
                    required
                    type="email"
                    className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                    value={f.email}
                    onChange={(e) => setF({ ...f, email: e.target.value })}
                  />
                </label>
                <label className="grid gap-1.5 text-[13.5px] font-medium text-neutral-700">
                  Teléfono
                  <input
                    required
                    className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-[14px] outline-none focus:border-[#FF5C89]"
                    value={f.phone}
                    onChange={(e) => setF({ ...f, phone: e.target.value })}
                  />
                </label>

                {error && <p className="text-[13.5px] text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#FF5C89] px-6 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#e14c76] disabled:opacity-60"
                >
                  <Lock size={16} /> {enviando ? "Conectando…" : `Pagar ${clp(plan.priceClp)}`}
                </button>
                <p className="text-center text-[12px] text-neutral-500">
                  Te llevamos a la pasarela de pago para completar la transacción.
                </p>
              </form>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
