import { useCallback, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { api } from "@/lib/api";
import { fechaCorta } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Badge, Cargando, Tarjeta, TarjetaCabecera, Vacio } from "@/components/pp/base";

type Plantilla = { id: string; key: string; name: string; subject: string; htmlBody: string; sampleVars: Record<string, unknown> };
type Campana = { id: string; name: string; subject: string; status: string; recipientsCount: number; sentAt: string | null; createdAt: string };
type Outbox = {
  correos: Array<{ id: number; toEmail: string; subject: string; status: string; templateKey: string | null; createdAt: string }>;
  resumen: { enCola: number; enviados: number; fallidos: number };
};

const AUDIENCIAS = [
  { id: "todas", texto: "Todas las alumnas" },
  { id: "active", texto: "Con plan activo" },
  { id: "expiring", texto: "Plan por vencer" },
  { id: "expired", texto: "Plan vencido" },
  { id: "none", texto: "Sin plan" },
];

/** Reemplaza {{var}} con los ejemplos, para previsualizar como lo verá la alumna. */
const previsualizar = (html: string, vars: Record<string, unknown>) =>
  html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => String(vars?.[k] ?? `{{${k}}}`));

export default function Emails() {
  const [tab, setTab] = useState<"plantillas" | "campana" | "outbox">("plantillas");
  const [plantillas, setPlantillas] = useState<Plantilla[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [outbox, setOutbox] = useState<Outbox | null>(null);

  const [nombre, setNombre] = useState("");
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("<p>Hola {{nombre}},</p>\n<p></p>");
  const [audiencia, setAudiencia] = useState("todas");
  const [inactivas, setInactivas] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargarOutbox = useCallback(() => { api.get<Outbox>("/admin/outbox").then(setOutbox); }, []);

  useEffect(() => {
    api.get<Plantilla[]>("/admin/email-templates").then((p) => { setPlantillas(p); setSel(p[0]?.key ?? null); });
    api.get<Campana[]>("/admin/campaigns").then(setCampanas);
    cargarOutbox();
  }, [cargarOutbox]);

  // El conteo de destinatarias se recalcula en vivo mientras se elige el filtro.
  useEffect(() => {
    if (tab !== "campana") return;
    api.post<{ total: number }>("/admin/campaigns/preview-audience", {
      membership: audiencia,
      inactiveDays: inactivas ? Number(inactivas) : undefined,
    }).then((r) => setTotal(r.total));
  }, [tab, audiencia, inactivas]);

  async function enviar() {
    const r = await api.post<{ destinatarias: number }>("/admin/campaigns", {
      name: nombre, subject: asunto, htmlBody: cuerpo,
      audience: { membership: audiencia, inactiveDays: inactivas ? Number(inactivas) : undefined, marketingOptIn: true },
      enviar: true,
    });
    setAviso(`Campaña encolada para ${r.destinatarias} alumna(s). Puedes verla en la bandeja de salida.`);
    setNombre(""); setAsunto("");
    api.get<Campana[]>("/admin/campaigns").then(setCampanas);
    cargarOutbox();
  }

  const plantilla = plantillas?.find((p) => p.key === sel);

  return (
    <AdminShell titulo="Emails" sub="Avisos automáticos y campañas a tus alumnas">
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      <div className="pp-tabs" style={{ marginBottom: 18 }}>
        <button className="pp-tab" aria-selected={tab === "plantillas"} onClick={() => setTab("plantillas")}>Avisos automáticos</button>
        <button className="pp-tab" aria-selected={tab === "campana"} onClick={() => setTab("campana")}>Nueva campaña</button>
        <button className="pp-tab" aria-selected={tab === "outbox"} onClick={() => setTab("outbox")}>
          Bandeja de salida{outbox ? ` (${outbox.resumen.enCola})` : ""}
        </button>
      </div>

      {tab === "plantillas" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Alerta tono="info">
              Estos correos salen solos cuando ocurre algo: una reserva, una cancelación, un plan por vencer.
              Para la demostración quedan en la bandeja de salida en vez de enviarse.
            </Alerta>
          </div>
          {!plantillas ? <Cargando /> : (
            <div className="pp-grilla pp-grilla-2">
              <Tarjeta>
                <TarjetaCabecera titulo="Correos del sistema" sub={`${plantillas.length} plantillas`} />
                <div className="pp-tarjeta-cuerpo sin-relleno">
                  {plantillas.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setSel(p.key)}
                      style={{
                        display: "block", width: "100%", textAlign: "left", padding: "13px 18px",
                        border: 0, borderBottom: "1px solid var(--linea)", cursor: "pointer",
                        background: sel === p.key ? "var(--papel-3)" : "transparent", minHeight: 44,
                      }}
                    >
                      <b style={{ fontSize: 14 }}>{p.name}</b>
                      <div style={{ fontSize: 12.5, color: "var(--tinta-suave)", marginTop: 2 }}>{p.subject}</div>
                    </button>
                  ))}
                </div>
              </Tarjeta>

              <Tarjeta>
                <TarjetaCabecera titulo="Vista previa" sub={plantilla ? plantilla.name : undefined} />
                <div className="pp-tarjeta-cuerpo">
                  {plantilla && (
                    <>
                      <div style={{ fontSize: 13, color: "var(--tinta-suave)", marginBottom: 10 }}>
                        <b style={{ color: "var(--tinta)" }}>Asunto:</b>{" "}
                        {previsualizar(plantilla.subject, plantilla.sampleVars ?? {})}
                      </div>
                      <div
                        style={{ border: "1px solid var(--linea)", borderRadius: 11, overflow: "hidden", background: "#fff" }}
                        dangerouslySetInnerHTML={{ __html: previsualizar(plantilla.htmlBody, plantilla.sampleVars ?? {}) }}
                      />
                    </>
                  )}
                </div>
              </Tarjeta>
            </div>
          )}
        </>
      )}

      {tab === "campana" && (
        <div className="pp-grilla pp-grilla-2">
          <Tarjeta>
            <TarjetaCabecera titulo="Escribe tu campaña" />
            <div className="pp-tarjeta-cuerpo">
              <label className="pp-campo">
                <span>Nombre interno</span>
                <input className="pp-input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Reactivación septiembre" />
              </label>
              <label className="pp-campo">
                <span>Asunto del correo</span>
                <input className="pp-input" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Te extrañamos en el reformer" />
              </label>
              <label className="pp-campo">
                <span>Mensaje</span>
                <textarea className="pp-textarea" value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
                <small>Escribe {"{{nombre}}"} donde quieras que aparezca el nombre de cada alumna.</small>
              </label>
            </div>
          </Tarjeta>

          <Tarjeta>
            <TarjetaCabecera titulo="¿A quién le llega?" />
            <div className="pp-tarjeta-cuerpo">
              <label className="pp-campo">
                <span>Grupo</span>
                <select className="pp-select" value={audiencia} onChange={(e) => setAudiencia(e.target.value)}>
                  {AUDIENCIAS.map((a) => <option key={a.id} value={a.id}>{a.texto}</option>)}
                </select>
              </label>
              <label className="pp-campo">
                <span>Que no vengan hace al menos…</span>
                <input className="pp-input" type="number" value={inactivas} onChange={(e) => setInactivas(e.target.value)} placeholder="por ejemplo 30" />
                <small>En días. Déjalo vacío para no filtrar por asistencia.</small>
              </label>

              <div style={{ padding: 16, background: "var(--papel-3)", borderRadius: 11, marginBottom: 16 }}>
                <div style={{ fontSize: 12, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--tinta-suave)", fontWeight: 600 }}>
                  Destinatarias
                </div>
                <div style={{ fontSize: 30, fontWeight: 750, letterSpacing: "-.03em", marginTop: 4 }}>
                  {total === null ? "…" : total}
                </div>
                <div style={{ fontSize: 13, color: "var(--tinta-media)", marginTop: 4 }}>
                  Sólo alumnas que aceptaron recibir correos.
                </div>
              </div>

              <button
                className="pp-btn primario ancho"
                disabled={!nombre.trim() || !asunto.trim() || !total}
                onClick={() => void enviar()}
              >
                <Send size={16} /> Enviar a {total ?? 0} alumna(s)
              </button>
            </div>
          </Tarjeta>

          {campanas.length > 0 && (
            <Tarjeta style={{ gridColumn: "1 / -1" }}>
              <TarjetaCabecera titulo="Campañas anteriores" />
              <div className="pp-tarjeta-cuerpo sin-relleno">
                <div className="pp-tabla-scroll">
                  <table className="pp-tabla">
                    <thead><tr><th>Campaña</th><th>Asunto</th><th className="num">Destinatarias</th><th>Enviada</th></tr></thead>
                    <tbody>
                      {campanas.map((c) => (
                        <tr key={c.id}>
                          <td><b>{c.name}</b></td>
                          <td style={{ color: "var(--tinta-media)" }}>{c.subject}</td>
                          <td className="num">{c.recipientsCount}</td>
                          <td>{c.sentAt ? fechaCorta(c.sentAt.slice(0, 10)) : <Badge>Borrador</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tarjeta>
          )}
        </div>
      )}

      {tab === "outbox" && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Alerta tono="info">
              Todos los correos pasan por acá antes de salir. Así, si el servicio de correo falla,
              una reserva nunca se deshace por eso. Hoy quedan en cola sin enviarse.
            </Alerta>
          </div>
          {!outbox ? <Cargando /> : (
            <>
              <div className="pp-grilla pp-grilla-kpi" style={{ marginBottom: 18 }}>
                <Tarjeta className="pp-kpi">
                  <div className="pp-kpi-etiqueta">En cola</div>
                  <div className="pp-kpi-valor">{outbox.resumen.enCola}</div>
                </Tarjeta>
                <Tarjeta className="pp-kpi">
                  <div className="pp-kpi-etiqueta">Enviados</div>
                  <div className="pp-kpi-valor">{outbox.resumen.enviados}</div>
                </Tarjeta>
                <Tarjeta className="pp-kpi">
                  <div className="pp-kpi-etiqueta">Con error</div>
                  <div className="pp-kpi-valor">{outbox.resumen.fallidos}</div>
                </Tarjeta>
              </div>
              <Tarjeta>
                {outbox.correos.length === 0 ? <Vacio titulo="La bandeja está vacía" /> : (
                  <div className="pp-tabla-scroll">
                    <table className="pp-tabla">
                      <thead><tr><th>Para</th><th>Asunto</th><th>Tipo</th><th>Estado</th><th>Creado</th></tr></thead>
                      <tbody>
                        {outbox.correos.map((c) => (
                          <tr key={c.id}>
                            <td>{c.toEmail}</td>
                            <td style={{ color: "var(--tinta-media)" }}>{c.subject}</td>
                            <td style={{ color: "var(--tinta-suave)", fontSize: 13 }}>{c.templateKey ?? "campaña"}</td>
                            <td><Badge tono={c.status === "sent" ? "ok" : c.status === "failed" ? "mal" : "aviso"}>{c.status === "queued" ? "En cola" : c.status === "sent" ? "Enviado" : "Error"}</Badge></td>
                            <td style={{ color: "var(--tinta-media)", whiteSpace: "nowrap" }}>{fechaCorta(c.createdAt.slice(0, 10))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tarjeta>
            </>
          )}
        </>
      )}
    </AdminShell>
  );
}
