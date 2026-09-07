import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminShell from "@/components/pp/AdminShell";
import { Cargando, Tarjeta, TarjetaCabecera, Vacio } from "@/components/pp/base";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  interest: string | null;
  status: string;
  createdAt: string;
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Leads() {
  const [leads, setLeads] = useState<Lead[] | null>(null);

  useEffect(() => { api.get<Lead[]>("/admin/leads").then(setLeads); }, []);

  if (!leads) return <AdminShell titulo="Contactos"><Cargando que="los contactos" /></AdminShell>;

  return (
    <AdminShell titulo="Contactos" sub="Quién escribió desde el formulario del sitio">
      <Tarjeta>
        <TarjetaCabecera titulo="Últimos contactos" sub="Los 100 más recientes" />
        <div className="pp-tarjeta-cuerpo sin-relleno">
          {leads.length === 0 ? (
            <div style={{ padding: 20 }}>
              <Vacio titulo="Todavía no hay contactos">Cuando alguien escriba desde /contacto va a aparecer acá.</Vacio>
            </div>
          ) : (
            <div className="pp-tabla-scroll">
              <table className="pp-tabla">
                <thead>
                  <tr>
                    <th>Nombre</th><th>Contacto</th><th>Interés</th><th>Mensaje</th><th>Cuándo</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id}>
                      <td><b>{l.name}</b></td>
                      <td style={{ color: "var(--tinta-media)" }}>
                        {l.email}
                        {l.phone && <><br />{l.phone}</>}
                      </td>
                      <td>{l.interest ?? "—"}</td>
                      <td style={{ maxWidth: 320, color: "var(--tinta-media)" }}>{l.message ?? "—"}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--tinta-suave)" }}>{fecha(l.createdAt)}</td>
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
