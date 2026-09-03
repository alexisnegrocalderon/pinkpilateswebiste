import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ESTADO_RESERVA, fechaCorta, fechaRelativa, hora, hoyEnSantiago } from "@/lib/format";
import StudentShell from "@/components/pp/StudentShell";
import { Alerta, Badge, Cargando, Modal, Tarjeta, Vacio } from "@/components/pp/base";

type Reserva = {
  id: string; status: string; localDate: string; startTime: string; className: string;
  instructorName: string; roomName: string; hoursToStart: number; creditCharged: boolean;
};

export default function MisReservas() {
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const [datos, setDatos] = useState<Reserva[] | null>(null);
  const [cancelar, setCancelar] = useState<Reserva | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const hoy = hoyEnSantiago();

  const cargar = useCallback(() => {
    setDatos(null);
    api.get<Reserva[]>(`/me/reservations?scope=${scope}`).then(setDatos);
  }, [scope]);
  useEffect(cargar, [cargar]);

  async function confirmar() {
    if (!cancelar) return;
    setOcupado(true);
    try {
      const r = await api.del<{ message: string; refunded: boolean }>(`/bookings/${cancelar.id}`);
      setAviso(r.message);
      setCancelar(null);
      cargar();
    } finally {
      setOcupado(false);
    }
  }

  const tardia = cancelar ? cancelar.hoursToStart < 12 : false;

  return (
    <StudentShell titulo="Mis clases" sub="Lo que viene y lo que ya hiciste">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      <div className="pp-filtros" style={{ marginBottom: 16 }}>
        <button className="pp-chip" aria-pressed={scope === "upcoming"} onClick={() => setScope("upcoming")}>Próximas</button>
        <button className="pp-chip" aria-pressed={scope === "past"} onClick={() => setScope("past")}>Historial</button>
      </div>

      <Tarjeta>
        {!datos ? <Cargando /> : datos.length === 0 ? (
          <Vacio titulo={scope === "upcoming" ? "No tienes clases reservadas" : "Todavía no tienes historial"}>
            {scope === "upcoming" && "Reserva tu próxima clase desde la agenda."}
          </Vacio>
        ) : (
          <div className="pp-tarjeta-cuerpo sin-relleno">
            {datos.map((r) => (
              <div
                key={r.id}
                style={{ padding: "16px 18px", borderBottom: "1px solid var(--linea)", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}
              >
                <div style={{
                  background: "var(--papel-3)", borderRadius: 11, padding: "10px 13px",
                  textAlign: "center", minWidth: 74, flex: "0 0 auto",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--tinta-suave)" }}>
                    {scope === "upcoming" ? fechaRelativa(r.localDate, hoy) : fechaCorta(r.localDate)}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>{hora(r.startTime)}</div>
                </div>

                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  <b style={{ fontSize: 15.5 }}>{r.className}</b>
                  <div style={{ fontSize: 13.5, color: "var(--tinta-suave)" }}>{r.instructorName} · {r.roomName}</div>
                </div>

                <Badge tono={r.status === "attended" ? "ok" : r.status === "no_show" ? "mal" : r.status === "booked" ? "rosa" : ""}>
                  {ESTADO_RESERVA[r.status]}
                </Badge>

                {r.status === "booked" && r.hoursToStart > 0 && (
                  <button className="pp-btn chico" onClick={() => setCancelar(r)}>Cancelar</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Tarjeta>

      {cancelar && (
        <Modal
          titulo="¿Cancelar esta clase?"
          onCerrar={() => setCancelar(null)}
          pie={
            <>
              <button className="pp-btn" onClick={() => setCancelar(null)}>Mantener mi reserva</button>
              <button className="pp-btn peligro" onClick={() => void confirmar()} disabled={ocupado}>
                {ocupado ? "Cancelando…" : "Sí, cancelar"}
              </button>
            </>
          }
        >
          <p style={{ marginBottom: 14, color: "var(--tinta-media)" }}>
            <b>{cancelar.className}</b> — {fechaCorta(cancelar.localDate)} a las {hora(cancelar.startTime)}
          </p>
          {/* Se dice ANTES de confirmar si pierde el crédito: nadie debe enterarse después. */}
          {tardia ? (
            <Alerta tono="aviso">
              Faltan menos de 12 horas, así que <b>este crédito no se devuelve</b>.
              El cupo sí queda libre para otra alumna.
            </Alerta>
          ) : (
            <Alerta tono="ok">
              Estás a tiempo: <b>te devolvemos el crédito completo</b> y podrás usarlo en otra clase.
            </Alerta>
          )}
        </Modal>
      )}
    </StudentShell>
  );
}
