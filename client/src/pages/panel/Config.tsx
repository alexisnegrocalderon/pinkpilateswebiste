import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Cargando, Tarjeta, TarjetaCabecera } from "@/components/pp/base";

type Settings = Record<string, number | boolean>;

const CAMPOS: Array<{ key: string; titulo: string; ayuda: string; tipo: "numero" | "si-no"; unidad?: string }> = [
  { key: "late_cancel_hours", titulo: "Cancelación sin costo", tipo: "numero", unidad: "horas antes",
    ayuda: "Si cancela con menos de este tiempo, la alumna pierde el crédito. El cupo se libera igual y entra quien esté en lista de espera." },
  { key: "booking_closes_minutes_before", titulo: "Cierre de reservas", tipo: "numero", unidad: "minutos antes",
    ayuda: "Cuánto antes del inicio deja de poder reservarse una clase." },
  { key: "booking_opens_days_ahead", titulo: "Reservas abiertas con", tipo: "numero", unidad: "días de anticipación",
    ayuda: "Hasta cuántos días hacia adelante pueden reservar tus alumnas." },
  { key: "booking_horizon_days", titulo: "Calendario generado", tipo: "numero", unidad: "días hacia adelante",
    ayuda: "Cuántos días de clases se crean automáticamente desde el horario semanal." },
  { key: "no_show_forfeits_credit", titulo: "No llegar consume el crédito", tipo: "si-no",
    ayuda: "Si está activo, quien reserva y no aparece pierde la clase igual." },
];

export default function Config() {
  const [s, setS] = useState<Settings | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => { api.get<Settings>("/admin/settings").then(setS); }, []);

  async function guardar(key: string, value: number | boolean) {
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
    await api.patch("/admin/settings", { [key]: value });
    setAviso("Guardado. Aplica desde la próxima reserva.");
  }

  if (!s) return <AdminShell titulo="Configuración"><Cargando /></AdminShell>;

  return (
    <AdminShell titulo="Configuración" sub="Las reglas de tu estudio">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      <Tarjeta style={{ maxWidth: 720 }}>
        <TarjetaCabecera titulo="Políticas de reserva" sub="Se aplican solas, sin que tengas que estar encima" />
        <div className="pp-tarjeta-cuerpo">
          {CAMPOS.map((c) => (
            <div key={c.key} style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--linea)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 300px" }}>
                  <b style={{ fontSize: 14.5 }}>{c.titulo}</b>
                  <p style={{ fontSize: 13.5, color: "var(--tinta-suave)", marginTop: 4, lineHeight: 1.45 }}>{c.ayuda}</p>
                </div>
                <div style={{ flex: "0 0 auto" }}>
                  {c.tipo === "numero" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <input
                        className="pp-input"
                        type="number"
                        style={{ width: 92 }}
                        value={String(s[c.key] ?? "")}
                        onChange={(e) => void guardar(c.key, Number(e.target.value))}
                      />
                      <span style={{ fontSize: 13.5, color: "var(--tinta-suave)", whiteSpace: "nowrap" }}>{c.unidad}</span>
                    </div>
                  ) : (
                    <button className="pp-chip" aria-pressed={Boolean(s[c.key])} onClick={() => void guardar(c.key, !s[c.key])}>
                      {s[c.key] ? "Sí" : "No"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Tarjeta>
    </AdminShell>
  );
}
