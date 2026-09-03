import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clp, SEGMENTO } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Badge, Cargando, Modal, Tarjeta, TarjetaCabecera } from "@/components/pp/base";

type Plan = {
  id: string; slug: string; name: string; segment: string; periodMonths: number;
  credits: number; priceClp: number; validityDays: number; requiresVerification: boolean;
  isDropIn: boolean; allowedWeekdays: number[] | null; allowedTimeFrom: string | null;
  allowedTimeTo: string | null; isPublic: boolean; isActive: boolean; badge: string | null; vendidos: number;
};

const PERIODO: Record<number, string> = { 1: "Mensual", 3: "Trimestral", 6: "Semestral", 12: "Anual" };

export default function Planes() {
  const [planes, setPlanes] = useState<Plan[] | null>(null);
  const [editando, setEditando] = useState<Plan | null>(null);
  const [precio, setPrecio] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(() => { api.get<Plan[]>("/admin/plans").then(setPlanes); }, []);
  useEffect(cargar, [cargar]);

  async function guardar() {
    if (!editando) return;
    await api.patch(`/admin/plans/${editando.id}`, { priceClp: Number(precio) });
    setEditando(null);
    setAviso(`Precio actualizado. El nuevo valor ya se ve en el sitio, y las alumnas que ya compraron mantienen lo que pagaron.`);
    cargar();
  }

  async function alternarPublico(p: Plan) {
    await api.patch(`/admin/plans/${p.id}`, { isPublic: !p.isPublic });
    cargar();
  }

  if (!planes) return <AdminShell titulo="Planes y precios"><Cargando que="los planes" /></AdminShell>;

  const grupos = ["adult", "student", "valle", "special"];

  return (
    <AdminShell titulo="Planes y precios" sub="Lo que vendes y a qué precio">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      <div style={{ marginBottom: 18 }}>
        <Alerta tono="info">
          Un crédito equivale a una clase. Cambiar un precio aquí lo cambia en el sitio al instante,
          pero no altera lo que ya pagaron las alumnas con plan vigente.
        </Alerta>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {grupos.map((g) => {
          const delGrupo = planes.filter((p) => p.segment === g);
          if (!delGrupo.length) return null;
          const valle = g === "valle";
          return (
            <Tarjeta key={g}>
              <TarjetaCabecera
                titulo={SEGMENTO[g]}
                sub={
                  valle
                    ? "Sólo lunes a viernes entre las 15:00 y las 17:00 — el sistema lo hace cumplir al reservar"
                    : g === "student"
                      ? "Requieren certificado de alumno regular: el plan queda pendiente hasta que lo verificas"
                      : undefined
                }
              />
              <div className="pp-tarjeta-cuerpo sin-relleno">
                <div className="pp-tabla-scroll">
                  <table className="pp-tabla">
                    <thead>
                      <tr>
                        <th>Plan</th><th>Periodo</th><th className="num">Créditos</th>
                        <th className="num">Precio</th><th className="num">Por clase</th>
                        <th className="num">Vendidos</th><th>En el sitio</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {delGrupo.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <b>{p.name}</b>
                            {p.badge && <> <Badge tono="rosa">{p.badge}</Badge></>}
                          </td>
                          <td style={{ color: "var(--tinta-media)" }}>{PERIODO[p.periodMonths] ?? `${p.periodMonths} meses`}</td>
                          <td className="num">{p.credits}</td>
                          <td className="num"><b>{clp(p.priceClp)}</b></td>
                          <td className="num" style={{ color: "var(--tinta-suave)" }}>{clp(Math.round(p.priceClp / p.credits))}</td>
                          <td className="num">{p.vendidos}</td>
                          <td>
                            <button className="pp-chip" aria-pressed={p.isPublic} onClick={() => void alternarPublico(p)}>
                              {p.isPublic ? "Visible" : "Oculto"}
                            </button>
                          </td>
                          <td>
                            <button
                              className="pp-btn chico"
                              onClick={() => { setEditando(p); setPrecio(String(p.priceClp)); }}
                            >
                              Cambiar precio
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tarjeta>
          );
        })}
      </div>

      {editando && (
        <Modal
          titulo={`Precio de ${editando.name}`}
          onCerrar={() => setEditando(null)}
          pie={
            <>
              <button className="pp-btn" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="pp-btn primario" onClick={() => void guardar()}>Guardar</button>
            </>
          }
        >
          <label className="pp-campo">
            <span>Precio en pesos</span>
            <input className="pp-input" type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            <small>
              {editando.credits} créditos ·{" "}
              {clp(Math.round(Number(precio || 0) / editando.credits))} por clase
            </small>
          </label>
        </Modal>
      )}
    </AdminShell>
  );
}
