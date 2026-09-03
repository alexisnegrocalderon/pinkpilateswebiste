import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Users, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { diaCorto, diaNumero, ESTADO_RESERVA, fechaLarga, hora, hoyEnSantiago } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Badge, BarraCupo, Cargando, Cupo, Modal, PanelLateral, Tarjeta, Vacio, iniciales } from "@/components/pp/base";

type Clase = {
  id: string; localDate: string; startTime: string; capacity: number; bookedCount: number;
  waitlistCount: number; status: string; className: string; color: string;
  roomName: string; instructorName: string;
};

type Roster = {
  session: { className: string; localDate: string; startTime: string; capacity: number;
    bookedCount: number; status: string; roomName: string; instructorName: string };
  inscritas: Array<{ id: string; status: string; checkedInAt: string | null; studentId: string;
    firstName: string; lastName: string; phone: string | null; planName: string | null;
    creditsRemaining: number | null; noShowsTotal: number }>;
  espera: Array<{ id: string; firstName: string; lastName: string; createdAt: string }>;
};

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
};

/** Lunes de la semana que contiene esa fecha. */
const lunesDe = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return addDays(iso, -((dt.getUTCDay() + 6) % 7));
};

export default function Agenda() {
  const hoy = hoyEnSantiago();
  const [desde, setDesde] = useState(() => lunesDe(hoy));
  const [clases, setClases] = useState<Clase[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const dias = Array.from({ length: 7 }, (_, i) => addDays(desde, i));

  const cargar = useCallback(() => {
    setClases(null);
    api.get<Clase[]>(`/admin/calendar?from=${desde}&to=${addDays(desde, 6)}`).then(setClases);
  }, [desde]);

  useEffect(cargar, [cargar]);

  useEffect(() => {
    if (!sel) return setRoster(null);
    setRoster(null);
    api.get<Roster>(`/admin/sessions/${sel}/roster`).then(setRoster);
  }, [sel]);

  async function cancelarClase() {
    if (!sel) return;
    setOcupado(true);
    try {
      const r = await api.post<{ afectadas: number }>(`/admin/sessions/${sel}/cancel`, { reason: motivo || undefined });
      setAviso(
        r.afectadas === 0
          ? "Clase cancelada. No había alumnas inscritas."
          : `Clase cancelada. ${r.afectadas} alumna(s) recuperaron su crédito y recibieron un aviso por correo.`,
      );
      setConfirmarCancelar(false);
      setSel(null);
      setMotivo("");
      cargar();
    } finally {
      setOcupado(false);
    }
  }

  async function marcarAsistencia(reservationId: string, present: boolean) {
    if (!sel) return;
    await api.post(`/admin/sessions/${sel}/attendance`, { marks: [{ reservationId, present }] });
    setRoster(await api.get<Roster>(`/admin/sessions/${sel}/roster`));
  }

  async function soltarReserva(reservationId: string) {
    if (!sel) return;
    await api.del(`/admin/reservations/${reservationId}?waivePenalty=true`);
    setRoster(await api.get<Roster>(`/admin/sessions/${sel}/roster`));
    cargar();
  }

  const yaPaso = roster ? new Date(`${roster.session.localDate}T23:59:59`) < new Date() : false;

  return (
    <AdminShell
      titulo="Agenda"
      sub={`Semana del ${fechaLarga(desde)}`}
      acciones={
        <>
          <button className="pp-btn chico" onClick={() => setDesde(addDays(desde, -7))} aria-label="Semana anterior">
            <ChevronLeft size={16} /> Anterior
          </button>
          <button className="pp-btn chico" onClick={() => setDesde(lunesDe(hoy))}>Esta semana</button>
          <button className="pp-btn chico" onClick={() => setDesde(addDays(desde, 7))} aria-label="Semana siguiente">
            Siguiente <ChevronRight size={16} />
          </button>
        </>
      }
    >
      {aviso && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tono="ok">{aviso}</Alerta>
        </div>
      )}

      <Tarjeta>
        {!clases ? (
          <Cargando que="la agenda" />
        ) : (
          <div className="pp-semana">
            {dias.map((d) => {
              const delDia = clases.filter((c) => c.localDate === d);
              return (
                <div key={d} className={`pp-dia ${d === hoy ? "hoy" : ""}`}>
                  <div className="pp-dia-cabecera">
                    <b>{diaCorto(d)}</b>
                    <span>{diaNumero(d)}</span>
                  </div>
                  {delDia.length === 0 && (
                    <p style={{ padding: "14px 12px", fontSize: 12.5, color: "var(--tinta-suave)" }}>Sin clases</p>
                  )}
                  {delDia.map((c) => (
                    <button
                      key={c.id}
                      className={`pp-clase ${c.status === "cancelled" ? "cancelada" : ""}`}
                      style={{ borderLeftColor: c.color }}
                      onClick={() => setSel(c.id)}
                    >
                      <div className="pp-clase-hora">{hora(c.startTime)}</div>
                      <div className="pp-clase-nombre">{c.className}</div>
                      <div className="pp-clase-pie">
                        <Cupo usado={c.bookedCount} total={c.capacity} />
                        {c.waitlistCount > 0 && <span style={{ color: "var(--ambar)" }}>+{c.waitlistCount} en espera</span>}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </Tarjeta>

      {sel && (
        <PanelLateral
          titulo={roster?.session.className ?? "Clase"}
          sub={roster ? `${fechaLarga(roster.session.localDate)} · ${hora(roster.session.startTime)} · ${roster.session.roomName}` : undefined}
          onCerrar={() => setSel(null)}
          pie={
            roster && roster.session.status !== "cancelled" ? (
              <button className="pp-btn peligro" onClick={() => setConfirmarCancelar(true)}>
                <XCircle size={16} /> Cancelar esta clase
              </button>
            ) : undefined
          }
        >
          {!roster ? (
            <Cargando que="la lista" />
          ) : (
            <>
              {roster.session.status === "cancelled" && (
                <div style={{ marginBottom: 16 }}>
                  <Alerta tono="mal">Esta clase está cancelada. Las alumnas ya recuperaron su crédito.</Alerta>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 13.5 }}>
                  <span style={{ color: "var(--tinta-media)" }}>
                    {roster.session.bookedCount} de {roster.session.capacity} cupos · {roster.session.instructorName}
                  </span>
                  <b>{Math.round((100 * roster.session.bookedCount) / roster.session.capacity)}%</b>
                </div>
                <BarraCupo usado={roster.session.bookedCount} total={roster.session.capacity} />
              </div>

              <h3 style={{ fontSize: 13, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--tinta-suave)", marginBottom: 10 }}>
                Inscritas ({roster.inscritas.length})
              </h3>

              {roster.inscritas.length === 0 ? (
                <Vacio titulo="Nadie inscrita todavía" />
              ) : (
                <div style={{ display: "grid", gap: 9, marginBottom: 22 }}>
                  {roster.inscritas.map((a) => (
                    <div key={a.id} style={{ border: "1px solid var(--linea)", borderRadius: 11, padding: 12 }}>
                      <div className="pp-persona">
                        <div className="pp-avatar">{iniciales(a.firstName, a.lastName)}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <b>{a.firstName} {a.lastName}</b>
                          <span>
                            {a.planName ?? "Sin plan"}
                            {a.creditsRemaining !== null && ` · ${a.creditsRemaining} créditos`}
                            {a.noShowsTotal >= 3 && ` · ${a.noShowsTotal} inasistencias`}
                          </span>
                        </div>
                        <Badge tono={a.status === "attended" ? "ok" : a.status === "no_show" ? "mal" : ""}>
                          {ESTADO_RESERVA[a.status]}
                        </Badge>
                      </div>

                      {yaPaso ? (
                        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                          <button
                            className={`pp-btn chico ${a.status === "attended" ? "primario" : ""}`}
                            onClick={() => void marcarAsistencia(a.id, true)}
                          >
                            Asistió
                          </button>
                          <button
                            className={`pp-btn chico ${a.status === "no_show" ? "peligro" : ""}`}
                            onClick={() => void marcarAsistencia(a.id, false)}
                          >
                            No llegó
                          </button>
                        </div>
                      ) : (
                        a.status === "booked" && (
                          <div style={{ marginTop: 10 }}>
                            <button className="pp-btn chico" onClick={() => void soltarReserva(a.id)}>
                              Liberar cupo sin penalidad
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}

              {roster.espera.length > 0 && (
                <>
                  <h3 style={{ fontSize: 13, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--tinta-suave)", marginBottom: 10 }}>
                    Lista de espera ({roster.espera.length})
                  </h3>
                  <div style={{ marginBottom: 14 }}>
                    <Alerta tono="info">
                      Si se libera un cupo, la primera de la fila entra sola y recibe un correo. No tienes que hacer nada.
                    </Alerta>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 14 }}>
                    {roster.espera.map((e) => (
                      <li key={e.id}>{e.firstName} {e.lastName}</li>
                    ))}
                  </ol>
                </>
              )}
            </>
          )}
        </PanelLateral>
      )}

      {confirmarCancelar && (
        <Modal
          titulo="¿Cancelar esta clase?"
          onCerrar={() => setConfirmarCancelar(false)}
          pie={
            <>
              <button className="pp-btn" onClick={() => setConfirmarCancelar(false)}>Volver</button>
              <button className="pp-btn peligro" onClick={() => void cancelarClase()} disabled={ocupado}>
                {ocupado ? "Cancelando…" : "Sí, cancelar la clase"}
              </button>
            </>
          }
        >
          <p style={{ color: "var(--tinta-media)", marginBottom: 16 }}>
            Las {roster?.inscritas.filter((i) => i.status === "booked").length ?? 0} alumna(s) inscritas
            recuperan su crédito completo, aunque falte menos de 12 horas, y reciben un correo avisando.
          </p>
          <label className="pp-campo">
            <span>Motivo (opcional, lo ves sólo tú)</span>
            <input
              className="pp-input"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Instructora enferma, corte de luz…"
            />
          </label>
        </Modal>
      )}
    </AdminShell>
  );
}
