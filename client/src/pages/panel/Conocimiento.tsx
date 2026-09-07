import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Cargando, Tarjeta, TarjetaCabecera } from "@/components/pp/base";

type Pregunta = { pregunta: string; respuesta: string };
type BaseConocimiento = { infoGeneral: string; preguntasFrecuentes: Pregunta[] };

const VACIO: BaseConocimiento = { infoGeneral: "", preguntasFrecuentes: [] };

/**
 * Se guarda en la tabla `settings` bajo la key "businessKnowledge" — no
 * necesita tabla propia. Hoy nadie la consume todavía: es donde Javiera va
 * a poder cargar información del negocio para que, más adelante, el agente
 * de WhatsApp (fase aparte) la use como contexto para responder preguntas.
 */
export default function Conocimiento() {
  const [base, setBase] = useState<BaseConocimiento | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ businessKnowledge?: BaseConocimiento }>("/admin/settings").then((s) => {
      setBase(s.businessKnowledge ?? VACIO);
    });
  }, []);

  async function guardar(next: BaseConocimiento) {
    setBase(next);
    await api.patch("/admin/settings", { businessKnowledge: next });
    setAviso("Guardado.");
  }

  if (!base) return <AdminShell titulo="Base de conocimiento"><Cargando /></AdminShell>;

  return (
    <AdminShell titulo="Base de conocimiento" sub="Lo que va a saber el futuro agente de WhatsApp">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}
      <div style={{ marginBottom: 18 }}>
        <Alerta tono="info">
          Esto todavía no está conectado a nada — es donde vas dejando la información del negocio
          (políticas, datos del estudio, dudas frecuentes) para que, cuando armemos el agente de
          WhatsApp, tenga de dónde responder con la info real y actualizada.
        </Alerta>
      </div>

      <Tarjeta style={{ maxWidth: 720, marginBottom: 18 }}>
        <TarjetaCabecera titulo="Información general" sub="Dirección, políticas, qué hace especial al estudio, etc." />
        <div className="pp-tarjeta-cuerpo">
          <textarea
            className="pp-input"
            rows={8}
            placeholder="Ej: Pink Pilates está en Angamos 326, Reñaca. Los planes no se congelan salvo..."
            value={base.infoGeneral}
            onChange={(e) => setBase({ ...base, infoGeneral: e.target.value })}
            onBlur={() => void guardar(base)}
          />
        </div>
      </Tarjeta>

      <Tarjeta style={{ maxWidth: 720 }}>
        <TarjetaCabecera
          titulo="Preguntas frecuentes"
          sub="Las dudas que más te llegan por WhatsApp, con la respuesta que darías tú"
          acciones={
            <button
              className="pp-btn chico"
              onClick={() =>
                void guardar({
                  ...base,
                  preguntasFrecuentes: [...base.preguntasFrecuentes, { pregunta: "", respuesta: "" }],
                })
              }
            >
              <Plus size={15} /> Agregar
            </button>
          }
        />
        <div className="pp-tarjeta-cuerpo" style={{ display: "grid", gap: 16 }}>
          {base.preguntasFrecuentes.length === 0 && (
            <p style={{ fontSize: 13.5, color: "var(--tinta-suave)" }}>Todavía no agregaste ninguna.</p>
          )}
          {base.preguntasFrecuentes.map((p, i) => (
            <div key={i} style={{ display: "grid", gap: 8, paddingBottom: 16, borderBottom: "1px solid var(--linea)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="pp-input"
                  placeholder="¿Sirve si nunca hice pilates?"
                  value={p.pregunta}
                  onChange={(e) => {
                    const next = [...base.preguntasFrecuentes];
                    next[i] = { ...next[i], pregunta: e.target.value };
                    setBase({ ...base, preguntasFrecuentes: next });
                  }}
                  onBlur={() => void guardar(base)}
                />
                <button
                  className="pp-btn chico"
                  aria-label="Eliminar"
                  onClick={() => {
                    const next = base.preguntasFrecuentes.filter((_, idx) => idx !== i);
                    void guardar({ ...base, preguntasFrecuentes: next });
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <textarea
                className="pp-input"
                rows={2}
                placeholder="Sí, la mayoría de nuestras alumnas parte sin experiencia previa..."
                value={p.respuesta}
                onChange={(e) => {
                  const next = [...base.preguntasFrecuentes];
                  next[i] = { ...next[i], respuesta: e.target.value };
                  setBase({ ...base, preguntasFrecuentes: next });
                }}
                onBlur={() => void guardar(base)}
              />
            </div>
          ))}
        </div>
      </Tarjeta>
    </AdminShell>
  );
}
