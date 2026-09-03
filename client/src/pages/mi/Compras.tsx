import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clp, ESTADO_ORDEN, fechaCorta } from "@/lib/format";
import StudentShell from "@/components/pp/StudentShell";
import { Badge, Cargando, Tarjeta, Vacio } from "@/components/pp/base";

type Orden = { id: string; orderNumber: string; status: string; totalClp: number; paidAt: string | null; createdAt: string };

export default function MisCompras() {
  const [o, setO] = useState<Orden[] | null>(null);
  useEffect(() => { api.get<Orden[]>("/me/orders").then(setO); }, []);

  return (
    <StudentShell titulo="Mis compras" sub="Todo lo que has pagado">
      <Tarjeta>
        {!o ? <Cargando /> : o.length === 0 ? <Vacio titulo="Todavía no tienes compras" /> : (
          <div className="pp-tabla-scroll">
            <table className="pp-tabla">
              <thead><tr><th>Orden</th><th>Fecha</th><th>Estado</th><th className="num">Monto</th></tr></thead>
              <tbody>
                {o.map((x) => (
                  <tr key={x.id}>
                    <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{x.orderNumber}</td>
                    <td style={{ color: "var(--tinta-media)" }}>{fechaCorta((x.paidAt ?? x.createdAt).slice(0, 10))}</td>
                    <td><Badge tono={x.status === "paid" ? "ok" : x.status === "failed" ? "mal" : "aviso"}>{ESTADO_ORDEN[x.status]}</Badge></td>
                    <td className="num"><b>{clp(x.totalClp)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </StudentShell>
  );
}
