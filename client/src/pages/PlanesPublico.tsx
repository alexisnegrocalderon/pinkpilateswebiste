import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SEGMENTO } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Alerta, Cargando } from "@/components/pp/base";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanCarousel } from "@/components/planes/PlanCarousel";
import type { Plan } from "@/components/planes/PlanCard";

export default function PlanesPublico() {
  const [planes, setPlanes] = useState<Plan[] | null>(null);
  const [segmento, setSegmento] = useState("adult");
  const [error, setError] = useState<string | null>(null);
  const { usuario } = useAuth();

  useEffect(() => { api.get<Plan[]>("/public/plans").then(setPlanes); }, []);

  async function comprar(p: Plan) {
    if (!usuario) return void (window.location.href = "/ingresar");
    try {
      const orden = await api.post<{ orderId: string }>("/orders", { planSlug: p.slug });
      window.location.href = `/checkout/${orden.orderId}`;
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!planes) return <div className="pp-app"><Cargando que="los planes" /></div>;

  const segmentos = [...new Set(planes.map((p) => p.segment))];

  return (
    <div className="pp-app">
      <section className="relative overflow-hidden px-5 pb-6 pt-16 sm:pt-20">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#FF5C89]/20 blur-2xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-[36px] uppercase leading-[0.98] text-neutral-900 [font-family:var(--font-display)] sm:text-[48px]">
            Planes y precios
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-neutral-600">Un crédito equivale a una clase.</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 pb-24">
        {error && (
          <div className="mx-auto mb-6 max-w-xl">
            <Alerta tono="mal">{error}</Alerta>
          </div>
        )}

        <Tabs value={segmento} onValueChange={setSegmento}>
          <TabsList className="mx-auto mb-8 flex h-auto w-fit max-w-full gap-2 overflow-x-auto rounded-full bg-transparent p-0">
            {segmentos.map((s) => (
              <TabsTrigger
                key={s}
                value={s}
                className="rounded-full border-none bg-[#FFDBDB] px-4 py-2 text-[13.5px] font-semibold text-[#B4285A] shadow-none transition-colors data-[state=active]:!bg-[#FF5C89] data-[state=active]:!text-white data-[state=active]:shadow-none"
              >
                {SEGMENTO[s] ?? s}
              </TabsTrigger>
            ))}
          </TabsList>

          {segmentos.map((s) => (
            <TabsContent key={s} value={s}>
              {s === "valle" && (
                <div className="mx-auto mb-6 max-w-xl">
                  <Alerta tono="info">
                    Los planes valle son más económicos porque se usan en los horarios más tranquilos:
                    de lunes a viernes entre las 15:00 y las 17:00.
                  </Alerta>
                </div>
              )}
              {s === "student" && (
                <div className="mx-auto mb-6 max-w-xl">
                  <Alerta tono="info">
                    Necesitas presentar tu certificado de alumno regular. El plan queda listo apenas el estudio lo verifica.
                  </Alerta>
                </div>
              )}

              <PlanCarousel plans={planes.filter((p) => p.segment === s)} loggedIn={!!usuario} onComprar={comprar} />
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
