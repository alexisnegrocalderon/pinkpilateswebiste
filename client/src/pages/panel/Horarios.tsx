import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { hora } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Badge, Cargando, Modal, Tarjeta, TarjetaCabecera, Vacio } from "@/components/pp/base";

type Plantilla = {
  id: string; weekday: number; startTime: string; durationMin: number; capacity: number;
  isActive: boolean; className: string; color: string; roomName: string; roomId: string;
  classTypeId: string; instructorName: string; instructorId: string | null; materializedThrough: string | null;
};
type Opcion = { id: string; name?: string; firstName?: string; lastName?: string; defaultCapacity?: number; capacity?: number };

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Horarios() {
  const [plantillas, setPlantillas] = useState<Plantilla[] | null>(null);
  const [tipos, setTipos] = useState<Opcion[]>([]);
  const [salas, setSalas] = useState<Opcion[]>([]);
  const [instructoras, setInstructoras] = useState<Opcion[]>([]);
  const [nuevo, setNuevo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [form, setForm] = useState({ classTypeId: "", roomId: "", instructorId: "", weekday: "1", startTime: "09:00", capacity: "5" });

  const cargar = useCallback(() => { api.get<Plantilla[]>("/admin/templates").then(setPlantillas); }, []);

  useEffect(() => {
    cargar();
    api.get<Opcion[]>("/admin/class-types").then(setTipos);
    api.get<Opcion[]>("/admin/rooms").then(setSalas);
    api.get<Opcion[]>("/admin/instructors").then(setInstructoras);
  }, [cargar]);

  async function crear() {
    try {
      const r = await api.post<{ clasesGeneradas: number }>("/admin/templates", {
        classTypeId: form.classTypeId,
        roomId: form.roomId,
        instructorId: form.instructorId || null,
        weekday: Number(form.weekday),
        startTime: form.startTime,
        capacity: Number(form.capacity),
      });
      setNuevo(false);
      setAviso(`Bloque agregado. Se generaron ${r.clasesGeneradas} clases en el calendario, listas para reservar.`);
      cargar();
    } catch (e) {
      setAviso((e as Error).message);
    }
  }

  async function generar() {
    const r = await api.post<{ clasesGeneradas: number }>("/admin/materialize", {});
    setAviso(`Listo: ${r.clasesGeneradas} clases nuevas en el calendario.`);
    cargar();
  }

  async function alternar(p: Plantilla) {
    await api.patch(`/admin/templates/${p.id}`, { isActive: !p.isActive });
    cargar();
  }

  return (
    <AdminShell
      titulo="Horario semanal"
      sub="Las reglas que generan tu calendario"
      acciones={
        <>
          <button className="pp-btn chico" onClick={() => void generar()}><RefreshCw size={15} /> Generar próximas semanas</button>
          <button className="pp-btn chico primario" onClick={() => setNuevo(true)}><Plus size={15} /> Agregar bloque</button>
        </>
      }
    >
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      <div style={{ marginBottom: 18 }}>
        <Alerta tono="info">
          Aquí defines la regla — "todos los martes a las 19:00 hay Studio Pilates" — y el sistema crea las clases
          concretas hacia adelante. Cambiar una regla no toca las clases que ya tienen alumnas inscritas.
        </Alerta>
      </div>

      {!plantillas ? <Cargando que="el horario" /> : (
        <div style={{ display: "grid", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const delDia = plantillas.filter((p) => p.weekday === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (!delDia.length) return null;
            return (
              <Tarjeta key={d}>
                <TarjetaCabecera titulo={DIAS[d]} sub={`${delDia.length} bloque(s)`} />
                <div className="pp-tarjeta-cuerpo sin-relleno">
                  <div className="pp-tabla-scroll">
                    <table className="pp-tabla">
                      <thead><tr><th>Hora</th><th>Clase</th><th>Instructora</th><th>Sala</th><th className="num">Cupo</th><th>Estado</th></tr></thead>
                      <tbody>
                        {delDia.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{hora(p.startTime)}</td>
                            <td>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <i style={{ width: 8, height: 8, borderRadius: 3, background: p.color, display: "inline-block" }} />
                                {p.className}
                              </span>
                            </td>
                            <td style={{ color: "var(--tinta-media)" }}>{p.instructorName}</td>
                            <td style={{ color: "var(--tinta-media)" }}>{p.roomName}</td>
                            <td className="num">{p.capacity}</td>
                            <td>
                              <button className="pp-chip" aria-pressed={p.isActive} onClick={() => void alternar(p)}>
                                {p.isActive ? "Activo" : "Pausado"}
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
      )}

      {nuevo && (
        <Modal
          titulo="Agregar un bloque al horario"
          onCerrar={() => setNuevo(false)}
          pie={
            <>
              <button className="pp-btn" onClick={() => setNuevo(false)}>Cancelar</button>
              <button className="pp-btn primario" onClick={() => void crear()} disabled={!form.classTypeId || !form.roomId}>
                Agregar y generar clases
              </button>
            </>
          }
        >
          <label className="pp-campo">
            <span>Tipo de clase</span>
            <select
              className="pp-select"
              value={form.classTypeId}
              onChange={(e) => {
                const t = tipos.find((x) => x.id === e.target.value);
                setForm({ ...form, classTypeId: e.target.value, capacity: String(t?.defaultCapacity ?? 5) });
              }}
            >
              <option value="">Elige…</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <div className="pp-fila">
            <label className="pp-campo">
              <span>Día</span>
              <select className="pp-select" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DIAS[d]}</option>)}
              </select>
            </label>
            <label className="pp-campo">
              <span>Hora</span>
              <input className="pp-input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </label>
          </div>
          <div className="pp-fila">
            <label className="pp-campo">
              <span>Sala</span>
              <select className="pp-select" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
                <option value="">Elige…</option>
                {salas.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.capacity} lugares)</option>)}
              </select>
            </label>
            <label className="pp-campo">
              <span>Cupo</span>
              <input className="pp-input" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </label>
          </div>
          <label className="pp-campo">
            <span>Instructora</span>
            <select className="pp-select" value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })}>
              <option value="">Por definir</option>
              {instructoras.map((i) => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>)}
            </select>
          </label>
          <Alerta tono="info">
            Si ya hay otra clase en esa sala a esa hora, el sistema no te dejará guardarlo.
          </Alerta>
        </Modal>
      )}
    </AdminShell>
  );
}
