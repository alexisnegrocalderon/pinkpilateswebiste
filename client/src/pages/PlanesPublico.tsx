import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Check } from "lucide-react";
import { api } from "@/lib/api";
import { clp, SEGMENTO } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Alerta, Cargando, Tarjeta } from "@/components/pp/base";

type Plan = {
  id: string; slug: string; name: string; segment: string; periodMonths: number; credits: number;
  priceClp: number; validityDays: number; requiresVerification: boolean; isDropIn: boolean;
  allowedWeekdays: number[] | null; allowedTimeFrom: string | null; allowedTimeTo: string | null; badge: string | null;
};

const PERIODO: Record<number, string> = { 1: "1 mes", 3: "3 meses", 6: "6 meses", 12: "12 meses" };

export default function PlanesPublico() {
  const [planes, setPlanes] = useState<Plan[] | null>(null);
  const [segmento, setSegmento] = useState("adult");
  const [error, setError] = useState<string | null>(null);
  const { usuario } = useAuth();
  const [, navegar] = useLocation();

  useEffect(() => { api.get<Plan[]>("/public/plans").then(setPlanes); }, []);

  async function comprar(p: Plan) {
    if (!usuario) return navegar("/ingresar");
    try {
      const orden = await api.post<{ orderId: string }>("/orders", { planSlug: p.slug });
      navegar(`/checkout/${orden.orderId}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!planes) return <div className="pp-app"><Cargando que="los planes" /></div>;

  const segmentos = [...new Set(planes.map((p) => p.segment))];
  const delSegmento = planes.filter((p) => p.segment === segmento);

  return (
    <div className="pp-app">
      <header className="pp-cabecera">
        <div>
          <h1>Planes</h1>
          <p>Un crédito equivale a una clase</p>
        </div>
        <div className="pp-cabecera-acciones">
          <Link href="/reservar" className="pp-btn chico">Ver horarios</Link>
          {usuario
            ? <Link href="/mi" className="pp-btn chico primario">Mi cuenta</Link>
            : <Link href="/ingresar" className="pp-btn chico primario">Entrar</Link>}
        </div>
      </header>

      <main className="pp-contenido">
        {error && <div style={{ marginBottom: 16 }}><Alerta tono="mal">{error}</Alerta></div>}

        <div className="pp-filtros" style={{ marginBottom: 20 }}>
          {segmentos.map((s) => (
            <button key={s} className="pp-chip" aria-pressed={segmento === s} onClick={() => setSegmento(s)}>
              {SEGMENTO[s] ?? s}
            </button>
          ))}
        </div>

        {segmento === "valle" && (
          <div style={{ marginBottom: 18, maxWidth: 640 }}>
            <Alerta tono="info">
              Los planes valle son más económicos porque se usan en los horarios más tranquilos:
              de lunes a viernes entre las 15:00 y las 17:00.
            </Alerta>
          </div>
        )}
        {segmento === "student" && (
          <div style={{ marginBottom: 18, maxWidth: 640 }}>
            <Alerta tono="info">
              Necesitas presentar tu certificado de alumno regular. El plan queda listo apenas el estudio lo verifica.
            </Alerta>
          </div>
        )}

        <div className="pp-grilla" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))" }}>
          {delSegmento.map((p) => (
            <Tarjeta key={p.id} style={p.badge ? { borderColor: "var(--rosa)", borderWidth: 2 } : undefined}>
              <div className="pp-tarjeta-cuerpo">
                {p.badge && (
                  <div style={{
                    display: "inline-block", background: "var(--rosa)", color: "#fff", fontSize: 11,
                    fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                    padding: "3px 10px", borderRadius: 999, marginBottom: 10,
                  }}>{p.badge}</div>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.02em" }}>{p.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "12px 0 4px" }}>
                  <span style={{ fontSize: 30, fontWeight: 750, letterSpacing: "-.03em" }}>{clp(p.priceClp)}</span>
                </div>
                <p style={{ fontSize: 13.5, color: "var(--tinta-suave)", marginBottom: 16 }}>
                  {clp(Math.round(p.priceClp / p.credits))} por clase
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "grid", gap: 8, fontSize: 14 }}>
                  <li style={{ display: "flex", gap: 8 }}>
                    <Check size={16} style={{ color: "var(--verde)", flex: "0 0 auto", marginTop: 2 }} />
                    <span><b>{p.credits}</b> {p.credits === 1 ? "clase" : "clases"}</span>
                  </li>
                  <li style={{ display: "flex", gap: 8 }}>
                    <Check size={16} style={{ color: "var(--verde)", flex: "0 0 auto", marginTop: 2 }} />
                    <span>Vigencia de {PERIODO[p.periodMonths] ?? `${p.validityDays} días`}</span>
                  </li>
                  {p.allowedWeekdays && (
                    <li style={{ display: "flex", gap: 8 }}>
                      <Check size={16} style={{ color: "var(--verde)", flex: "0 0 auto", marginTop: 2 }} />
                      <span>Lun a vie, 15:00 a 17:00</span>
                    </li>
                  )}
                  {p.requiresVerification && (
                    <li style={{ display: "flex", gap: 8, color: "var(--ambar)" }}>
                      <Check size={16} style={{ flex: "0 0 auto", marginTop: 2 }} />
                      <span>Con certificado de alumno regular</span>
                    </li>
                  )}
                </ul>

                <button className="pp-btn primario ancho" onClick={() => void comprar(p)}>
                  {usuario ? "Comprar" : "Entrar y comprar"}
                </button>
              </div>
            </Tarjeta>
          ))}
        </div>
      </main>
    </div>
  );
}
