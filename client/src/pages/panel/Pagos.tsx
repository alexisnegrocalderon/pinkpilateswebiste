import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clp, ESTADO_ORDEN, fechaCorta } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Badge, Cargando, Kpi, Tarjeta, Vacio, iniciales } from "@/components/pp/base";

type Orden = {
  id: string; orderNumber: string; status: string; totalClp: number;
  paidAt: string | null; createdAt: string; provider: string | null;
  studentId: string; firstName: string; lastName: string; email: string; items: string | null;
};

const FILTROS = [
  { id: "", texto: "Todas" },
  { id: "paid", texto: "Pagadas" },
  { id: "awaiting_payment", texto: "Esperando pago" },
  { id: "failed", texto: "Fallidas" },
];

export default function Pagos() {
  const [filtro, setFiltro] = useState("");
  const [ordenes, setOrdenes] = useState<Orden[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setOrdenes(null);
    api.get<Orden[]>(`/admin/orders${filtro ? `?estado=${filtro}` : ""}`).then(setOrdenes);
  }, [filtro]);
  useEffect(cargar, [cargar]);

  async function marcarPagada(o: Orden) {
    await api.post(`/admin/orders/${o.id}/mark-paid`);
    setAviso(`Orden ${o.orderNumber} marcada como pagada. Los créditos ya están disponibles para ${o.firstName}.`);
    cargar();
  }

  const pagadas = ordenes?.filter((o) => o.status === "paid") ?? [];
  const total = pagadas.reduce((s, o) => s + o.totalClp, 0);

  return (
    <AdminShell titulo="Pagos" sub="Todas las compras del estudio">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      <div className="pp-grilla pp-grilla-kpi" style={{ marginBottom: 18 }}>
        <Kpi etiqueta="Total cobrado" valor={clp(total)} nota={`${pagadas.length} órdenes pagadas`} />
        <Kpi
          etiqueta="Ticket promedio"
          valor={clp(pagadas.length ? Math.round(total / pagadas.length) : 0)}
        />
        <Kpi
          etiqueta="Esperando pago"
          valor={ordenes?.filter((o) => o.status === "awaiting_payment").length ?? 0}
          nota="órdenes sin completar"
        />
      </div>

      <div className="pp-filtros" style={{ marginBottom: 14 }}>
        {FILTROS.map((f) => (
          <button key={f.id} className="pp-chip" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.texto}
          </button>
        ))}
      </div>

      <Tarjeta>
        {!ordenes ? <Cargando que="los pagos" /> : ordenes.length === 0 ? (
          <Vacio titulo="Sin órdenes con ese filtro" />
        ) : (
          <div className="pp-tabla-scroll">
            <table className="pp-tabla">
              <thead>
                <tr><th>Orden</th><th>Alumna</th><th>Concepto</th><th>Fecha</th><th>Medio</th><th>Estado</th><th className="num">Monto</th><th></th></tr>
              </thead>
              <tbody>
                {ordenes.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{o.orderNumber}</td>
                    <td>
                      <div className="pp-persona">
                        <div className="pp-avatar">{iniciales(o.firstName, o.lastName)}</div>
                        <div><b>{o.firstName} {o.lastName}</b><span>{o.email}</span></div>
                      </div>
                    </td>
                    <td style={{ color: "var(--tinta-media)" }}>{o.items ?? "—"}</td>
                    <td style={{ color: "var(--tinta-media)", whiteSpace: "nowrap" }}>
                      {fechaCorta((o.paidAt ?? o.createdAt).slice(0, 10))}
                    </td>
                    <td style={{ color: "var(--tinta-suave)" }}>
                      {o.provider === "efectivo" ? "Efectivo" : o.provider === "mock" ? "Online" : o.provider ?? "—"}
                    </td>
                    <td>
                      <Badge tono={o.status === "paid" ? "ok" : o.status === "failed" ? "mal" : "aviso"}>
                        {ESTADO_ORDEN[o.status]}
                      </Badge>
                    </td>
                    <td className="num"><b>{clp(o.totalClp)}</b></td>
                    <td>
                      {o.status !== "paid" && (
                        <button className="pp-btn chico" onClick={() => void marcarPagada(o)}>
                          Marcar pagada
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </AdminShell>
  );
}
