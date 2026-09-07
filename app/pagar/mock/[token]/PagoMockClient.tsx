"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { clp } from "@/lib/format";

type Token = { orderId: string; orderNumber: string; amountClp: number };

/**
 * Pagador simulado. Imita deliberadamente la pantalla de una pasarela chilena
 * para que el flujo se vea como el real: el pago se confirma vía webhook
 * firmado, exactamente como pasará cuando se conecte la pasarela definitiva.
 */
export default function PagoMockClient() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [t, setT] = useState<Token | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [medio, setMedio] = useState("credito");

  useEffect(() => {
    api.get<Token>(`/public/checkout/mock/${token}`).then(setT, (e) => setError((e as Error).message));
  }, [token]);

  async function resolver(resultado: "approved" | "rejected") {
    setProcesando(resultado);
    try {
      const r = await api.post<{ returnUrl: string }>(`/public/checkout/mock/${token}/${resultado}`);
      window.location.href = r.returnUrl;
    } catch (e) {
      setError((e as Error).message);
      setProcesando(null);
    }
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#1F2937] p-5">
        <p className="rounded-2xl bg-white px-6 py-5 text-[14px] text-red-600">{error}</p>
      </div>
    );
  }
  if (!t) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#1F2937]">
        <p className="text-[14px] text-white/70">Cargando el pago…</p>
      </div>
    );
  }

  const medios = [
    { id: "credito", texto: "Tarjeta de crédito" },
    { id: "debito", texto: "Tarjeta de débito" },
    { id: "transferencia", texto: "Transferencia bancaria" },
  ];

  return (
    <div className="grid min-h-screen place-items-center bg-[#1F2937] p-5">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-2.5 bg-[#111827] px-5 py-4 text-white">
          <ShieldCheck size={20} />
          <div>
            <div className="text-[15px] font-bold">Pago seguro</div>
            <div className="text-[11.5px] opacity-65">Entorno de demostración</div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 text-center">
            <div className="text-[12.5px] font-semibold uppercase tracking-wide text-neutral-500">Total a pagar</div>
            <div className="mt-1 text-[36px] font-extrabold tracking-tight text-neutral-900">{clp(t.amountClp)}</div>
            <div className="mt-1 text-[13px] text-neutral-500">Pink Pilates · orden {t.orderNumber}</div>
          </div>

          <div className="mb-5">
            <div className="mb-2 text-[13px] font-semibold text-neutral-700">Medio de pago</div>
            <div className="grid gap-2">
              {medios.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMedio(m.id)}
                  className={`flex min-h-[46px] w-full items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left text-[14.5px] transition-colors ${
                    medio === m.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                      medio === m.id ? "border-neutral-900 bg-neutral-900 shadow-[inset_0_0_0_3px_#fff]" : "border-neutral-300"
                    }`}
                  />
                  {m.texto}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void resolver("approved")}
            disabled={Boolean(procesando)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF5C89] px-4 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#e14c76] disabled:opacity-60"
          >
            <Lock size={16} /> {procesando === "approved" ? "Procesando…" : `Pagar ${clp(t.amountClp)}`}
          </button>
          <button
            type="button"
            onClick={() => void resolver("rejected")}
            disabled={Boolean(procesando)}
            className="mt-2.5 w-full rounded-lg px-4 py-3 text-[13.5px] font-medium text-neutral-500 transition-colors hover:text-neutral-800 disabled:opacity-60"
          >
            {procesando === "rejected" ? "Cancelando…" : "Cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}
