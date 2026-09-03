import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { clp, mesCorto } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Badge, Cargando, Tarjeta, TarjetaCabecera, Vacio } from "@/components/pp/base";

type Ingresos = {
  porPlan: Array<{ plan: string; segmento: string; ventas: number; total: number }>;
  porMes: Array<{ mes: string; total: number; ordenes: number }>;
};
type Ocupacion = { porHorario: Array<{ hora: string; dia: number; reservas: number; cupos: number; ocupacion: number }> };
type Retencion = {
  enRiesgo: Array<{ id: string; firstName: string; lastName: string; email: string; phone: string | null;
    ultimaVisita: string; diasSinVenir: number }>;
};

const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

/** Verde donde se llena, rosa pálido donde sobran cupos. */
function colorOcupacion(pct: number) {
  if (pct >= 80) return "#0E9F6E";
  if (pct >= 60) return "#FF5C89";
  if (pct >= 35) return "#FB8CAC";
  if (pct > 0) return "#FFDBE3";
  return "#F5F0F2";
}

export default function Reportes() {
  const [ing, setIng] = useState<Ingresos | null>(null);
  const [ocu, setOcu] = useState<Ocupacion | null>(null);
  const [ret, setRet] = useState<Retencion | null>(null);

  useEffect(() => {
    api.get<Ingresos>("/admin/reports/revenue").then(setIng);
    api.get<Ocupacion>("/admin/reports/occupancy").then(setOcu);
    api.get<Retencion>("/admin/reports/retention").then(setRet);
  }, []);

  const horas = [...new Set(ocu?.porHorario.map((o) => o.hora.slice(0, 5)) ?? [])].sort();

  return (
    <AdminShell titulo="Reportes" sub="Dónde está el dinero y dónde se está yendo">
      <Tarjeta style={{ marginBottom: 18 }}>
        <TarjetaCabecera titulo="Ingresos por plan" sub="Qué se vende de verdad, ordenado por lo que más deja" />
        <div className="pp-tarjeta-cuerpo sin-relleno">
          {!ing ? <Cargando /> : ing.porPlan.length === 0 ? <Vacio titulo="Sin ventas registradas" /> : (
            <div className="pp-tabla-scroll">
              <table className="pp-tabla">
                <thead><tr><th>Plan</th><th>Segmento</th><th className="num">Ventas</th><th className="num">Ingresos</th><th style={{ width: 180 }}>Participación</th></tr></thead>
                <tbody>
                  {ing.porPlan.map((p) => {
                    const max = ing.porPlan[0].total;
                    return (
                      <tr key={p.plan}>
                        <td><b>{p.plan}</b></td>
                        <td style={{ color: "var(--tinta-media)" }}>{p.segmento}</td>
                        <td className="num">{p.ventas}</td>
                        <td className="num"><b>{clp(p.total)}</b></td>
                        <td>
                          <div className="pp-barra"><i style={{ width: `${Math.round((100 * p.total) / max)}%` }} /></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta style={{ marginBottom: 18 }}>
        <TarjetaCabecera
          titulo="Ocupación por día y hora"
          sub="Últimos 60 días. Los bloques pálidos son horarios que no se llenan: ahí hay plata sobre la mesa"
        />
        <div className="pp-tarjeta-cuerpo">
          {!ocu ? <Cargando /> : ocu.porHorario.length === 0 ? <Vacio titulo="Sin clases en el periodo" /> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 12 }}>
                <thead>
                  <tr>
                    <th />
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <th key={d} style={{ padding: "4px 6px", color: "var(--tinta-suave)", fontWeight: 600, letterSpacing: ".06em" }}>
                        {DIAS[d]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horas.map((h) => (
                    <tr key={h}>
                      <td style={{ paddingRight: 8, color: "var(--tinta-suave)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{h}</td>
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                        const celda = ocu.porHorario.find((o) => o.dia === d && o.hora.slice(0, 5) === h);
                        return (
                          <td key={d}>
                            <div
                              title={celda ? `${DIAS[d]} ${h} — ${celda.ocupacion}% (${celda.reservas}/${celda.cupos})` : "sin clase"}
                              style={{
                                width: 54, height: 32, borderRadius: 7, display: "grid", placeItems: "center",
                                background: celda ? colorOcupacion(celda.ocupacion) : "transparent",
                                border: celda ? "none" : "1px dashed var(--linea)",
                                color: celda && celda.ocupacion >= 60 ? "#fff" : "var(--tinta-media)",
                                fontWeight: 700, fontSize: 11.5,
                              }}
                            >
                              {celda ? `${celda.ocupacion}%` : ""}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <TarjetaCabecera
          titulo="Alumnas que se están alejando"
          sub="Vinieron antes y llevan entre 2 semanas y 3 meses sin aparecer"
        />
        <div className="pp-tarjeta-cuerpo sin-relleno">
          {!ret ? <Cargando /> : ret.enRiesgo.length === 0 ? (
            <Vacio titulo="Nadie en riesgo ahora">Todas tus alumnas vinieron hace poco.</Vacio>
          ) : (
            <>
              <div style={{ padding: "14px 18px 0" }}>
                <Alerta tono="aviso">
                  Estas {ret.enRiesgo.length} alumnas son las candidatas naturales para una campaña de reactivación.
                  Puedes filtrarlas directamente desde Emails con "que no vengan hace 14 días".
                </Alerta>
              </div>
              <div className="pp-tabla-scroll" style={{ marginTop: 14 }}>
                <table className="pp-tabla">
                  <thead><tr><th>Alumna</th><th>Contacto</th><th className="num">Días sin venir</th></tr></thead>
                  <tbody>
                    {ret.enRiesgo.map((a) => (
                      <tr key={a.id}>
                        <td><b>{a.firstName} {a.lastName}</b></td>
                        <td style={{ color: "var(--tinta-media)" }}>{a.phone ?? a.email}</td>
                        <td className="num">
                          <Badge tono={a.diasSinVenir > 45 ? "mal" : "aviso"}>{a.diasSinVenir} días</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Tarjeta>
    </AdminShell>
  );
}
