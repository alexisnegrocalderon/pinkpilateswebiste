"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Fila = { rango: string; dias: boolean[] };

const TEMPORADA: { id: string; label: string; vigencia: string; filas: Fila[]; promo: string }[] = [
  {
    id: "regular",
    label: "Marzo – Diciembre",
    vigencia: "Horario vigente todo el año, salvo enero y febrero",
    filas: [
      { rango: "8:30 – 9:30", dias: [false, true, false, true, false, false, false] },
      { rango: "9:30 – 10:30", dias: [true, true, true, true, true, true, false] },
      { rango: "11:00 – 12:00", dias: [true, true, true, true, true, true, true] },
      { rango: "12:00 – 13:00", dias: [false, false, false, false, false, false, true] },
      { rango: "15:00 – 16:00", dias: [true, true, true, true, true, false, false] },
      { rango: "16:00 – 17:00", dias: [true, true, true, true, true, false, false] },
      { rango: "17:00 – 18:00", dias: [true, true, true, true, true, false, false] },
      { rango: "18:00 – 19:00", dias: [true, true, true, true, true, false, false] },
      { rango: "19:00 – 20:00", dias: [true, true, true, true, false, false, false] },
      { rango: "20:00 – 21:00", dias: [true, true, true, true, false, false, false] },
    ],
    promo: "Horario Valle: asiste a las clases de 15:00, 16:00 o 17:00 hrs y accede al plan más económico.",
  },
  {
    id: "verano",
    label: "Verano (Ene – Feb)",
    vigencia: "Horario reducido de temporada estival",
    filas: [
      { rango: "9:30 – 10:30", dias: [true, true, true, true, true, true, false] },
      { rango: "11:00 – 12:00", dias: [true, false, true, false, true, true, false] },
      { rango: "17:00 – 18:00", dias: [true, true, true, true, true, false, false] },
      { rango: "18:00 – 19:00", dias: [true, true, true, true, true, false, false] },
      { rango: "19:00 – 20:00", dias: [true, true, true, true, true, false, false] },
      { rango: "20:00 – 21:00", dias: [true, true, true, true, false, false, false] },
    ],
    promo: "Horario Valle: asiste a las clases de 17:00 hrs y accede al plan más económico.",
  },
];

export function HorarioTable() {
  const [activa, setActiva] = useState("regular");

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <Tabs value={activa} onValueChange={setActiva}>
        <TabsList className="mx-auto mb-6 flex h-auto w-fit max-w-full gap-2 overflow-x-auto rounded-full bg-transparent p-0">
          {TEMPORADA.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="rounded-full border-none bg-[#FFDBDB] px-4 py-2 text-[13px] font-semibold text-[#B4285A] shadow-none transition-colors data-[state=active]:!bg-[#FF5C89] data-[state=active]:!text-white data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TEMPORADA.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <p className="mb-1 text-center text-[13px] text-neutral-500">{t.vigencia}</p>
            <p className="mb-4 text-center text-[11.5px] text-neutral-400 sm:hidden">Desliza para ver toda la semana →</p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-separate border-spacing-0 text-center">
                <thead>
                  <tr>
                    <th className="w-24 border-b border-neutral-200 pb-3 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                      Hora
                    </th>
                    {DIAS.map((d) => (
                      <th
                        key={d}
                        className="border-b border-neutral-200 pb-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500"
                      >
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.filas.map((f) => (
                    <tr key={f.rango}>
                      <td className="whitespace-nowrap border-b border-neutral-100 py-2.5 text-left text-[13px] font-medium text-neutral-700">
                        {f.rango}
                      </td>
                      {f.dias.map((hay, i) => (
                        <td key={i} className="border-b border-neutral-100 py-2.5">
                          {hay && <Heart size={15} className="mx-auto fill-[#FF5C89] text-[#FF5C89]" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-2xl bg-[#FFF5F5] p-4 text-center">
              <p className="text-[13.5px] leading-relaxed text-neutral-600">{t.promo}</p>
              <p className="mt-1 text-[12px] text-neutral-500">
                Los horarios se abren con un mínimo de 3 alumnas inscritas · 1 crédito equivale a 1 clase.
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 text-center">
        <Link
          href="/planes"
          className="inline-block rounded-full bg-[#FF5C89] px-7 py-3.5 text-[14px] font-semibold uppercase tracking-wide text-white hover:bg-[#e14c76]"
        >
          Ver planes y comprar
        </Link>
      </div>
    </div>
  );
}
