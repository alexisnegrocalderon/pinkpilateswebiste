import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { clp, hora, mesCorto, numero } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Cargando, Cupo, Kpi, Tarjeta, TarjetaCabecera, Vacio } from "@/components/pp/base";

type Overview = {
  ingresosMes: number; ingresosMesAnterior: number; reservasSemana: number;
  alumnasActivas: number; ocupacionPct: number; planesPorVencer: number;
  porVerificar: number; noShowsMes: number; contactosNuevos: number;
  clasesHoy: Array<{ id: string; startTime: string; className: string; color: string;
    bookedCount: number; capacity: number; waitlistCount: number; roomName: string;
    instructorName: string; status: string }>;
  ingresosPorMes: Array<{ mes: string; total: number; ordenes: number }>;
  ocupacionPorClase: Array<{ clase: string; color: string; reservas: number; cupos: number; ocupacion: number }>;
};

export default function Resumen() {
  const [d, setD] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Overview>("/admin/overview").then(setD, (e) => setError(e.message));
  }, []);

  if (error) return <AdminShell titulo="Resumen"><Alerta tono="mal">{error}</Alerta></AdminShell>;
  if (!d) return <AdminShell titulo="Resumen"><Cargando que="tu estudio" /></AdminShell>;

  const variacion = d.ingresosMesAnterior
    ? Math.round((100 * (d.ingresosMes - d.ingresosMesAnterior)) / d.ingresosMesAnterior)
    : null;

  const avisos = [
    d.porVerificar > 0 && {
      texto: `${d.porVerificar} plan(es) de estudiante esperando que verifiques el certificado de alumno regular.`,
      href: "/panel/alumnas?estado=por_verificar",
    },
    d.planesPorVencer > 0 && {
      texto: `${d.planesPorVencer} alumna(s) con el plan venciendo esta semana.`,
      href: "/panel/alumnas?estado=por_vencer",
    },
  ].filter(Boolean) as Array<{ texto: string; href: string }>;

  return (
    <AdminShell titulo="Resumen" sub="Cómo va tu estudio hoy">
      {avisos.length > 0 && (
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {avisos.map((a) => (
            <Alerta key={a.href} tono="aviso">
              {a.texto}{" "}
              <Link href={a.href} style={{ color: "inherit", fontWeight: 700 }}>Ver →</Link>
            </Alerta>
          ))}
        </div>
      )}

      <div className="pp-grilla pp-grilla-kpi" style={{ marginBottom: 18 }}>
        <Kpi
          etiqueta="Ingresos del mes"
          valor={clp(d.ingresosMes)}
          nota={variacion === null ? "primer mes con ventas" : `${variacion >= 0 ? "+" : ""}${variacion}% vs. mismos días del mes anterior`}
          tendencia={variacion === null ? undefined : variacion >= 0 ? "sube" : "baja"}
        />
        <Kpi etiqueta="Alumnas activas" valor={numero(d.alumnasActivas)} nota="con plan vigente" />
        <Kpi etiqueta="Reservas esta semana" valor={numero(d.reservasSemana)} nota="clases tomadas y por tomar" />
        <Kpi
          etiqueta="Ocupación últimos 30 días"
          valor={`${d.ocupacionPct}%`}
          nota={d.ocupacionPct < 50 ? "hay cupos que no se están llenando" : "buen aprovechamiento"}
          tendencia={d.ocupacionPct < 50 ? "baja" : "sube"}
        />
      </div>

      <div className="pp-grilla pp-grilla-2" style={{ marginBottom: 18 }}>
        <Tarjeta>
          <TarjetaCabecera titulo="Ingresos por mes" sub="Últimos 6 meses, en pesos" />
          <div className="pp-tarjeta-cuerpo">
            {d.ingresosPorMes.length === 0 ? (
              <Vacio titulo="Todavía sin ventas">Cuando se paguen los primeros planes, el gráfico aparece acá.</Vacio>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={d.ingresosPorMes} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5C89" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#FF5C89" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5DDE4" vertical={false} />
                  <XAxis dataKey="mes" tickFormatter={mesCorto} tick={{ fontSize: 12, fill: "#9B7E8B" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} tick={{ fontSize: 12, fill: "#9B7E8B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number) => [clp(v), "Ingresos"]}
                    labelFormatter={mesCorto}
                    contentStyle={{ borderRadius: 11, border: "1px solid #F5DDE4", fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#FF5C89" strokeWidth={2.5} fill="url(#gIngresos)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Tarjeta>

        <Tarjeta>
          <TarjetaCabecera titulo="Ocupación por tipo de clase" sub="Cuánto se llenó cada una en 30 días" />
          <div className="pp-tarjeta-cuerpo">
            {d.ocupacionPorClase.length === 0 ? (
              <Vacio titulo="Sin datos todavía" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={d.ocupacionPorClase} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5DDE4" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#9B7E8B" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="clase" width={112} tick={{ fontSize: 12, fill: "#6B4655" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: number, _n, p) => [`${v}% (${p.payload.reservas} de ${p.payload.cupos} cupos)`, "Ocupación"]}
                    contentStyle={{ borderRadius: 11, border: "1px solid #F5DDE4", fontSize: 13 }}
                  />
                  <Bar dataKey="ocupacion" radius={[0, 6, 6, 0]} barSize={17}>
                    {d.ocupacionPorClase.map((c) => (
                      <Cell key={c.clase} fill={c.ocupacion >= 75 ? "#0E9F6E" : c.ocupacion >= 45 ? "#FF5C89" : "#FDC3D1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Tarjeta>
      </div>

      <Tarjeta>
        <TarjetaCabecera
          titulo="Clases de hoy"
          sub={`${d.clasesHoy.length} clase(s) programadas`}
          acciones={<Link href="/panel/agenda" className="pp-btn chico">Ver agenda completa <ArrowRight size={15} /></Link>}
        />
        <div className="pp-tarjeta-cuerpo sin-relleno">
          {d.clasesHoy.length === 0 ? (
            <Vacio titulo="Hoy no hay clases programadas">Puedes revisar el horario semanal para agregar bloques.</Vacio>
          ) : (
            <div className="pp-tabla-scroll">
              <table className="pp-tabla">
                <thead>
                  <tr>
                    <th>Hora</th><th>Clase</th><th>Instructora</th><th>Sala</th>
                    <th className="num">Cupos</th><th>Espera</th>
                  </tr>
                </thead>
                <tbody>
                  {d.clasesHoy.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{hora(c.startTime)}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          <i style={{ width: 8, height: 8, borderRadius: 3, background: c.color, display: "inline-block" }} />
                          {c.className}
                          {c.status === "cancelled" && <span className="pp-badge mal">Cancelada</span>}
                        </span>
                      </td>
                      <td style={{ color: "var(--tinta-media)" }}>{c.instructorName}</td>
                      <td style={{ color: "var(--tinta-media)" }}>{c.roomName}</td>
                      <td className="num"><Cupo usado={c.bookedCount} total={c.capacity} /></td>
                      <td>{c.waitlistCount > 0 ? <span className="pp-badge aviso">{c.waitlistCount} esperando</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Tarjeta>
    </AdminShell>
  );
}
