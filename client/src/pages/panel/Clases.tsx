import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clp, DISCIPLINA } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Cargando, Modal, Tarjeta, TarjetaCabecera } from "@/components/pp/base";

type ClassType = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  discipline: string;
  level: string;
  defaultDurationMin: number;
  defaultCapacity: number;
  dropInPriceClp: number | null;
  isPublic: boolean;
  isActive: boolean;
};

export default function Clases() {
  const [clases, setClases] = useState<ClassType[] | null>(null);
  const [editando, setEditando] = useState<ClassType | null>(null);
  const [form, setForm] = useState({ shortDescription: "", description: "", dropInPriceClp: "" });
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(() => { api.get<ClassType[]>("/admin/class-types").then(setClases); }, []);
  useEffect(cargar, [cargar]);

  function abrir(c: ClassType) {
    setEditando(c);
    setForm({
      shortDescription: c.shortDescription ?? "",
      description: c.description ?? "",
      dropInPriceClp: c.dropInPriceClp != null ? String(c.dropInPriceClp) : "",
    });
  }

  async function guardar() {
    if (!editando) return;
    await api.patch(`/admin/class-types/${editando.id}`, {
      shortDescription: form.shortDescription || null,
      description: form.description || null,
      dropInPriceClp: form.dropInPriceClp ? Number(form.dropInPriceClp) : null,
    });
    setEditando(null);
    setAviso("Descripción actualizada. Ya se ve en /clases.");
    cargar();
  }

  async function alternarPublico(c: ClassType) {
    await api.patch(`/admin/class-types/${c.id}`, { isPublic: !c.isPublic });
    cargar();
  }

  if (!clases) return <AdminShell titulo="Clases"><Cargando que="las clases" /></AdminShell>;

  return (
    <AdminShell titulo="Clases" sub="Lo que la gente lee antes de reservar en CrossHero">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      <Tarjeta>
        <TarjetaCabecera titulo="Tipos de clase" sub="La descripción se muestra en la página pública de cada clase" />
        <div className="pp-tarjeta-cuerpo sin-relleno">
          <div className="pp-tabla-scroll">
            <table className="pp-tabla">
              <thead>
                <tr>
                  <th>Clase</th><th>Disciplina</th><th className="num">Clase suelta</th>
                  <th>En el sitio</th><th></th>
                </tr>
              </thead>
              <tbody>
                {clases.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.name}</b></td>
                    <td style={{ color: "var(--tinta-media)" }}>{DISCIPLINA[c.discipline] ?? c.discipline}</td>
                    <td className="num">{c.dropInPriceClp != null ? clp(c.dropInPriceClp) : "—"}</td>
                    <td>
                      <button className="pp-chip" aria-pressed={c.isPublic} onClick={() => void alternarPublico(c)}>
                        {c.isPublic ? "Visible" : "Oculto"}
                      </button>
                    </td>
                    <td>
                      <button className="pp-btn chico" onClick={() => abrir(c)}>Editar descripción</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Tarjeta>

      {editando && (
        <Modal
          titulo={`Editar ${editando.name}`}
          onCerrar={() => setEditando(null)}
          pie={
            <>
              <button className="pp-btn" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="pp-btn primario" onClick={() => void guardar()}>Guardar</button>
            </>
          }
        >
          <label className="pp-campo">
            <span>Descripción corta</span>
            <input
              className="pp-input"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              maxLength={200}
            />
          </label>
          <label className="pp-campo">
            <span>Descripción completa</span>
            <textarea
              className="pp-input"
              rows={6}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="pp-campo">
            <span>Precio de clase suelta</span>
            <input
              className="pp-input"
              type="number"
              value={form.dropInPriceClp}
              onChange={(e) => setForm({ ...form, dropInPriceClp: e.target.value })}
            />
          </label>
        </Modal>
      )}
    </AdminShell>
  );
}
