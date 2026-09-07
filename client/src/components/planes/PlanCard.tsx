import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CROSSHERO_URL } from "@shared/domain/policy";
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

export function PlanCard({ plan }: { plan: Plan }) {
  const [abierto, setAbierto] = useState(false);
  const destacado = !!plan.badge;

  return (
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
      className={`flex h-full cursor-pointer flex-col rounded-3xl bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md ${
        destacado ? "ring-2 ring-[#FF5C89]" : "border border-neutral-200"
      }`}
    >
      {plan.badge && (
        <span className="mb-3 inline-block w-fit rounded-full bg-[#FF5C89] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {plan.badge}
        </span>
      )}

      <h3 className="text-[17px] font-semibold tracking-tight text-neutral-900">{plan.name}</h3>
      <div className="mt-3 text-[30px] font-bold tracking-tight text-neutral-900">{clp(plan.priceClp)}</div>
      <p className="mt-1 text-[13.5px] text-neutral-500">
        {clp(Math.round(plan.priceClp / plan.credits))} por clase
      </p>

      <div className="mt-4 flex justify-center">
        <span
          aria-hidden
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#FFDBDB] text-[#FF5C89] transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={18} />
        </span>
      </div>
      <span className="sr-only">{abierto ? "Ocultar detalles del plan" : "Ver detalles del plan"}</span>

      {abierto && (
        <ul className="mt-4 grid gap-2 text-[13.5px] text-neutral-700">
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

      <a
        href={CROSSHERO_URL}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-5 block w-full rounded-full bg-[#FF5C89] px-4 py-3 text-center text-[14px] font-semibold text-white transition-colors hover:bg-[#e14c76]"
      >
        Reservar en CrossHero
      </a>
    </div>
  );
}
