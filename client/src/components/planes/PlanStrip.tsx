import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { clp } from "@/lib/format";

export type Plan = {
  id: string;
  slug: string;
  name: string;
  segment: string;
  periodMonths: number;
  credits: number;
  priceClp: number;
  validityDays: number;
  requiresVerification: boolean;
  isDropIn: boolean;
  allowedWeekdays: number[] | null;
  allowedTimeFrom: string | null;
  allowedTimeTo: string | null;
  badge: string | null;
};

const PERIODO: Record<number, string> = { 1: "1 mes", 3: "3 meses", 6: "6 meses", 12: "12 meses" };

export function PlanStrip({ plan }: { plan: Plan }) {
  const [abierto, setAbierto] = useState(false);
  const destacado = !!plan.badge;

  return (
    <div
      className={`rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md ${
        destacado ? "ring-2 ring-[#FF5C89]" : "border border-neutral-200"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setAbierto((v) => !v);
          }
        }}
        className="flex cursor-pointer flex-wrap items-center gap-3 p-4 text-left sm:flex-nowrap"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-neutral-900">{plan.name}</h3>
              {plan.badge && (
                <span className="shrink-0 rounded-full bg-[#FF5C89] px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white">
                  {plan.badge}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              <span className="font-semibold text-neutral-800">{clp(plan.priceClp)}</span>
              {" · "}
              {clp(Math.round(plan.priceClp / plan.credits))} por clase
            </p>
          </div>
        </div>

        <span
          aria-hidden
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFDBDB] text-[#FF5C89] transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={16} />
        </span>
        <span className="sr-only">{abierto ? "Ocultar detalles del plan" : "Ver detalles del plan"}</span>

        <Link
          href={`/comprar/${plan.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="order-last w-full shrink-0 rounded-full bg-[#FF5C89] px-4 py-2.5 text-center text-[13.5px] font-semibold text-white transition-colors hover:bg-[#e14c76] sm:order-none sm:w-auto"
        >
          Comprar ahora
        </Link>
      </div>

      {abierto && (
        <ul className="grid gap-2 border-t border-neutral-100 px-4 pb-4 pt-3 text-[13.5px] text-neutral-700">
          <li className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>
              <b>{plan.credits}</b> {plan.credits === 1 ? "clase" : "clases"}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>Vigencia de {PERIODO[plan.periodMonths] ?? `${plan.validityDays} días`}</span>
          </li>
          {plan.allowedWeekdays && (
            <li className="flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              <span>Lun a vie, 15:00 a 17:00</span>
            </li>
          )}
          {plan.requiresVerification && (
            <li className="flex items-start gap-2 text-amber-600">
              <Check size={16} className="mt-0.5 shrink-0" />
              <span>Con certificado de alumno regular</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
