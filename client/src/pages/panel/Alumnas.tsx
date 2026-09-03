import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { ESTADO_MEMBRESIA, fechaCorta } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Badge, Cargando, Tarjeta, Vacio, iniciales } from "@/components/pp/base";

type Alumna = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null;
  planName: string | null; creditsRemaining: number | null; endsOn: string | null;
  membershipStatus: string | null; daysLeft: number | null;
  lastVisit: string | null; noShows: number; clasesTomadas: number;
};

const FILTROS = [
  { id: "", texto: "Todas" },
  { id: "activas", texto: "Con plan activo" },
  { id: "por_vencer", texto: "Por vencer" },
  { id: "por_verificar", texto: "Por verificar" },
  { id: "sin_plan", texto: "Sin plan" },
];

export default function Alumnas() {
  const [, navegar] = useLocation();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState(() => new URLSearchParams(window.location.search).get("estado") ?? "");
  const [datos, setDatos] = useState<Alumna[] | null>(null);

  const cargar = useCallback(() => {
    const p = new URLSearchParams();
    if (busqueda.trim()) p.set("q", busqueda.trim());
    if (filtro) p.set("estado", filtro);
    api.get<Alumna[]>(`/admin/students?${p}`).then(setDatos);
  }, [busqueda, filtro]);

  // Se espera a que deje de escribir para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(cargar, busqueda ? 280 : 0);
    return () => clearTimeout(t);
  }, [cargar, busqueda]);

  return (
    <AdminShell titulo="Alumnas" sub={datos ? `${datos.length} en tu estudio` : undefined}>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 380 }}>
          <Search
            size={17}
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tinta-suave)" }}
          />
          <input
            className="pp-input"
            style={{ paddingLeft: 38 }}
            placeholder="Buscar por nombre o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="pp-filtros">
          {FILTROS.map((f) => (
            <button key={f.id} className="pp-chip" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      <Tarjeta>
        {!datos ? (
          <Cargando que="las alumnas" />
        ) : datos.length === 0 ? (
          <Vacio titulo="Ninguna alumna con esos filtros">Prueba con otro término de búsqueda.</Vacio>
        ) : (
          <div className="pp-tabla-scroll">
            <table className="pp-tabla">
              <thead>
                <tr>
                  <th>Alumna</th><th>Plan</th><th className="num">Créditos</th>
                  <th>Vence</th><th>Última visita</th><th className="num">Clases</th>
                </tr>
              </thead>
              <tbody>
                {datos.map((a) => (
                  <tr key={a.id} className="clicable" onClick={() => navegar(`/admin/alumnas/${a.id}`)}>
                    <td>
                      <div className="pp-persona">
                        <div className="pp-avatar">{iniciales(a.firstName, a.lastName)}</div>
                        <div>
                          <b>{a.firstName} {a.lastName}</b>
                          <span>{a.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {a.planName ? (
                        <>
                          <div style={{ fontWeight: 500 }}>{a.planName}</div>
                          {a.membershipStatus === "pending_verification" && (
                            <Badge tono="aviso">Falta verificar certificado</Badge>
                          )}
                        </>
                      ) : (
                        <Badge>Sin plan</Badge>
                      )}
                    </td>
                    <td className="num">
                      {a.creditsRemaining === null ? "—" : (
                        <b style={{ color: a.creditsRemaining === 0 ? "var(--rojo)" : a.creditsRemaining <= 2 ? "var(--ambar)" : undefined }}>
                          {a.creditsRemaining}
                        </b>
                      )}
                    </td>
                    <td>
                      {a.endsOn ? (
                        a.daysLeft !== null && a.daysLeft <= 7 ? (
                          <Badge tono="aviso">
                            {a.daysLeft <= 0 ? "Vencido" : `en ${a.daysLeft} día${a.daysLeft === 1 ? "" : "s"}`}
                          </Badge>
                        ) : (
                          <span style={{ color: "var(--tinta-media)" }}>{fechaCorta(a.endsOn)}</span>
                        )
                      ) : "—"}
                    </td>
                    <td style={{ color: "var(--tinta-media)" }}>
                      {a.lastVisit ? fechaCorta(a.lastVisit.slice(0, 10)) : <span style={{ color: "var(--tinta-suave)" }}>nunca</span>}
                    </td>
                    <td className="num">
                      {a.clasesTomadas}
                      {a.noShows >= 3 && <div><Badge tono="mal">{a.noShows} faltas</Badge></div>}
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
