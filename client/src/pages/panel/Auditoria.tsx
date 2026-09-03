import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminShell from "@/components/pp/AdminShell";
import { Cargando, Tarjeta, Vacio } from "@/components/pp/base";

type Fila = { id: number; action: string; entityType: string | null; summary: string | null; createdAt: string; actor: string };

const cuando = (iso: string) =>
  new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));

export default function Auditoria() {
  const [filas, setFilas] = useState<Fila[] | null>(null);
  useEffect(() => { api.get<Fila[]>("/admin/audit").then(setFilas); }, []);

  return (
    <AdminShell titulo="Historial" sub="Todo lo que se hizo en el sistema, y quién lo hizo">
      <Tarjeta>
        {!filas ? <Cargando /> : filas.length === 0 ? (
          <Vacio titulo="Todavía no hay movimientos">
            Aquí quedará registrada cada cancelación de clase, ajuste de créditos y pago marcado a mano.
          </Vacio>
        ) : (
          <div className="pp-tabla-scroll">
            <table className="pp-tabla">
              <thead><tr><th>Cuándo</th><th>Quién</th><th>Qué pasó</th></tr></thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <td style={{ whiteSpace: "nowrap", color: "var(--tinta-media)" }}>{cuando(f.createdAt)}</td>
                    <td><b>{f.actor}</b></td>
                    <td>{f.summary ?? f.action}</td>
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
