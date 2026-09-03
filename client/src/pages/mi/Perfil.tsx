import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import StudentShell from "@/components/pp/StudentShell";
import { Alerta, Cargando, Tarjeta, TarjetaCabecera } from "@/components/pp/base";

type Me = {
  firstName: string; lastName: string; email: string; phone: string | null;
  profile: { emergencyContactName: string | null; emergencyContactPhone: string | null;
    healthNotes: string | null; goals: string | null; marketingOptIn: boolean } | null;
};

export default function MiPerfil() {
  const [f, setF] = useState<Record<string, string>>({});
  const [optIn, setOptIn] = useState(true);
  const [listo, setListo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    api.get<Me>("/auth/me").then((m) => {
      setF({
        firstName: m.firstName, lastName: m.lastName, phone: m.phone ?? "",
        emergencyContactName: m.profile?.emergencyContactName ?? "",
        emergencyContactPhone: m.profile?.emergencyContactPhone ?? "",
        healthNotes: m.profile?.healthNotes ?? "", goals: m.profile?.goals ?? "",
      });
      setOptIn(m.profile?.marketingOptIn ?? true);
      setListo(true);
    });
  }, []);

  const set = (k: string) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = { marketingOptIn: optIn };
    for (const [k, v] of Object.entries(f)) if (v.trim()) payload[k] = v.trim();
    await api.patch("/auth/me", payload);
    setAviso("Datos guardados.");
  }

  if (!listo) return <StudentShell titulo="Mi perfil"><Cargando /></StudentShell>;

  return (
    <StudentShell titulo="Mi perfil" sub="Tus datos y preferencias">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}
      <Tarjeta style={{ maxWidth: 620 }}>
        <TarjetaCabecera titulo="Tus datos" />
        <form className="pp-tarjeta-cuerpo" onSubmit={guardar}>
          <div className="pp-fila">
            <label className="pp-campo"><span>Nombre</span>
              <input className="pp-input" value={f.firstName} onChange={set("firstName")} /></label>
            <label className="pp-campo"><span>Apellido</span>
              <input className="pp-input" value={f.lastName} onChange={set("lastName")} /></label>
          </div>
          <label className="pp-campo"><span>Teléfono</span>
            <input className="pp-input" value={f.phone} onChange={set("phone")} /></label>
          <div className="pp-fila">
            <label className="pp-campo"><span>Contacto de emergencia</span>
              <input className="pp-input" value={f.emergencyContactName} onChange={set("emergencyContactName")} /></label>
            <label className="pp-campo"><span>Su teléfono</span>
              <input className="pp-input" value={f.emergencyContactPhone} onChange={set("emergencyContactPhone")} /></label>
          </div>
          <label className="pp-campo"><span>Notas de salud</span>
            <textarea className="pp-textarea" value={f.healthNotes} onChange={set("healthNotes")} />
            <small>Lesiones, embarazo, cirugías. Lo ve sólo tu instructora.</small></label>
          <label className="pp-campo"><span>Tus objetivos</span>
            <textarea className="pp-textarea" style={{ minHeight: 70 }} value={f.goals} onChange={set("goals")} /></label>
          <label className="pp-campo">
            <span>Correos del estudio</span>
            <button type="button" className="pp-chip" aria-pressed={optIn} onClick={() => setOptIn(!optIn)}>
              {optIn ? "Sí, quiero recibirlos" : "No, gracias"}
            </button>
            <small>Los avisos de tus reservas te llegan igual: esto es sólo para novedades y promociones.</small>
          </label>
          <button className="pp-btn primario" type="submit">Guardar cambios</button>
        </form>
      </Tarjeta>
    </StudentShell>
  );
}
