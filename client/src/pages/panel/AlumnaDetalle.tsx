import { useCallback, useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, BadgeCheck, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { clp, ESTADO_MEMBRESIA, ESTADO_ORDEN, ESTADO_RESERVA, fechaCorta, hora, MOTIVO_CREDITO } from "@/lib/format";
import AdminShell from "@/components/pp/AdminShell";
import { Alerta, Badge, Cargando, Modal, Tarjeta, TarjetaCabecera, Vacio, iniciales } from "@/components/pp/base";

type Ficha = {
  perfil: { id: string; firstName: string; lastName: string; email: string; phone: string | null;
    birthDate: string | null; emergencyContactName: string | null; emergencyContactPhone: string | null;
    healthNotes: string | null; goals: string | null; internalNotes: string | null;
    marketingOptIn: boolean; joinedAt: string; lastLoginAt: string | null };
  membresias: Array<{ id: string; planName: string; segment: string; status: string;
    creditsTotal: number; creditsUsed: number; creditsRemaining: number;
    startsOn: string; endsOn: string; pricePaidClp: number }>;
  reservas: Array<{ id: string; status: string; localDate: string; startTime: string; className: string }>;
  creditos: Array<{ id: number; delta: number; reason: string; note: string | null; createdAt: string }>;
  ordenes: Array<{ id: string; orderNumber: string; status: string; totalClp: number; paidAt: string | null; createdAt: string }>;
};

type Plan = { id: string; slug: string; name: string; priceClp: number; credits: number; segment: string };

const TABS = ["Resumen", "Planes", "Reservas", "Créditos", "Pagos"] as const;

export default function AlumnaDetalle() {
  const [, params] = useRoute("/admin/alumnas/:id");
  const id = params?.id;
  const [f, setF] = useState<Ficha | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumen");
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [modal, setModal] = useState<"plan" | "creditos" | null>(null);
  const [planSlug, setPlanSlug] = useState("");
  const [delta, setDelta] = useState("1");
  const [nota, setNota] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (id) api.get<Ficha>(`/admin/students/${id}`).then(setF);
  }, [id]);

  useEffect(cargar, [cargar]);
  useEffect(() => { api.get<Plan[]>("/admin/plans").then(setPlanes); }, []);

  if (!f) return <AdminShell titulo="Alumna"><Cargando que="la ficha" /></AdminShell>;

  const p = f.perfil;
  const activa = f.membresias.find((m) => m.status === "active");
  const porVerificar = f.membresias.find((m) => m.status === "pending_verification");

  async function otorgarPlan() {
    await api.post(`/admin/students/${id}/memberships`, { planSlug, marcarPagado: true });
    setModal(null);
    setAviso("Plan otorgado. Los créditos ya están disponibles para reservar.");
    cargar();
  }

  async function ajustarCreditos() {
    if (!activa && !porVerificar) return;
    const m = activa ?? porVerificar!;
    await api.post(`/admin/memberships/${m.id}/credits`, { delta: Number(delta), note: nota });
    setModal(null);
    setNota("");
    setAviso("Créditos ajustados. Queda registrado en el historial.");
    cargar();
  }

  async function verificar(membershipId: string) {
    await api.post(`/admin/memberships/${membershipId}/verify`);
    setAviso("Plan verificado y activado. La alumna ya puede reservar.");
    cargar();
  }

  return (
    <AdminShell
      titulo={`${p.firstName} ${p.lastName}`}
      sub={p.email}
      acciones={
        <>
          <Link href="/admin/alumnas" className="pp-btn chico"><ArrowLeft size={15} /> Volver</Link>
          <button className="pp-btn chico primario" onClick={() => setModal("plan")}><Plus size={15} /> Dar un plan</button>
        </>
      }
    >
      {aviso && <div style={{ marginBottom: 16 }}><Alerta tono="ok">{aviso}</Alerta></div>}

      {porVerificar && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tono="aviso">
            <b>{porVerificar.planName}</b> está esperando que verifiques el certificado de alumno regular.
            Sus {porVerificar.creditsTotal} créditos no se pueden usar hasta que lo apruebes.{" "}
            <button className="pp-btn chico" style={{ marginTop: 8 }} onClick={() => void verificar(porVerificar.id)}>
              <BadgeCheck size={15} /> Verificar y activar
            </button>
          </Alerta>
        </div>
      )}

      <div className="pp-grilla pp-grilla-kpi" style={{ marginBottom: 18 }}>
        <Tarjeta className="pp-kpi">
          <div className="pp-kpi-etiqueta">Plan vigente</div>
          <div style={{ fontSize: 19, fontWeight: 700, marginTop: 7, letterSpacing: "-.02em" }}>
            {activa?.planName ?? "Sin plan activo"}
          </div>
          {activa && <div className="pp-kpi-nota">Vence el {fechaCorta(activa.endsOn)}</div>}
        </Tarjeta>
        <Tarjeta className="pp-kpi">
          <div className="pp-kpi-etiqueta">Créditos disponibles</div>
          <div className="pp-kpi-valor">{activa?.creditsRemaining ?? 0}</div>
          {activa && <div className="pp-kpi-nota">de {activa.creditsTotal} comprados</div>}
        </Tarjeta>
        <Tarjeta className="pp-kpi">
          <div className="pp-kpi-etiqueta">Clases asistidas</div>
          <div className="pp-kpi-valor">{f.reservas.filter((r) => r.status === "attended").length}</div>
          <div className="pp-kpi-nota">{f.reservas.filter((r) => r.status === "no_show").length} inasistencias</div>
        </Tarjeta>
        <Tarjeta className="pp-kpi">
          <div className="pp-kpi-etiqueta">Total pagado</div>
          <div className="pp-kpi-valor">{clp(f.ordenes.filter((o) => o.status === "paid").reduce((s, o) => s + o.totalClp, 0))}</div>
          <div className="pp-kpi-nota">alumna desde {fechaCorta(p.joinedAt.slice(0, 10))}</div>
        </Tarjeta>
      </div>

      <Tarjeta>
        <div className="pp-tabs" style={{ padding: "0 8px" }}>
          {TABS.map((t) => (
            <button key={t} className="pp-tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        <div className="pp-tarjeta-cuerpo">
          {tab === "Resumen" && (
            <dl className="pp-datos">
              <dt>Teléfono</dt><dd>{p.phone ?? "—"}</dd>
              <dt>Contacto de emergencia</dt>
              <dd>{p.emergencyContactName ? `${p.emergencyContactName} · ${p.emergencyContactPhone ?? ""}` : "—"}</dd>
              <dt>Notas de salud</dt><dd>{p.healthNotes ?? "—"}</dd>
              <dt>Objetivos</dt><dd>{p.goals ?? "—"}</dd>
              <dt>Acepta correos</dt><dd>{p.marketingOptIn ? "Sí" : "No"}</dd>
              <dt>Último ingreso</dt><dd>{p.lastLoginAt ? fechaCorta(p.lastLoginAt.slice(0, 10)) : "nunca"}</dd>
              <dt>Notas internas</dt><dd>{p.internalNotes ?? "—"}</dd>
            </dl>
          )}

          {tab === "Planes" && (
            <>
              <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="pp-btn chico" onClick={() => setModal("creditos")} disabled={!activa && !porVerificar}>
                  Ajustar créditos a mano
                </button>
              </div>
              {f.membresias.length === 0 ? <Vacio titulo="Nunca ha comprado un plan" /> : (
                <div className="pp-tabla-scroll">
                  <table className="pp-tabla">
                    <thead><tr><th>Plan</th><th>Estado</th><th className="num">Créditos</th><th>Vigencia</th><th className="num">Pagado</th></tr></thead>
                    <tbody>
                      {f.membresias.map((m) => (
                        <tr key={m.id}>
                          <td><b>{m.planName}</b></td>
                          <td>
                            <Badge tono={m.status === "active" ? "ok" : m.status === "pending_verification" ? "aviso" : ""}>
                              {ESTADO_MEMBRESIA[m.status]}
                            </Badge>
                          </td>
                          <td className="num">{m.creditsRemaining} / {m.creditsTotal}</td>
                          <td style={{ color: "var(--tinta-media)" }}>{fechaCorta(m.startsOn)} → {fechaCorta(m.endsOn)}</td>
                          <td className="num">{clp(m.pricePaidClp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === "Reservas" && (
            f.reservas.length === 0 ? <Vacio titulo="Sin reservas todavía" /> : (
              <div className="pp-tabla-scroll">
                <table className="pp-tabla">
                  <thead><tr><th>Fecha</th><th>Clase</th><th>Estado</th></tr></thead>
                  <tbody>
                    {f.reservas.map((r) => (
                      <tr key={r.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{fechaCorta(r.localDate)} · {hora(r.startTime)}</td>
                        <td>{r.className}</td>
                        <td>
                          <Badge tono={r.status === "attended" ? "ok" : r.status === "no_show" ? "mal" : r.status === "booked" ? "rosa" : ""}>
                            {ESTADO_RESERVA[r.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "Créditos" && (
            f.creditos.length === 0 ? <Vacio titulo="Sin movimientos" /> : (
              <div className="pp-tabla-scroll">
                <table className="pp-tabla">
                  <thead><tr><th>Fecha</th><th>Movimiento</th><th className="num">Créditos</th><th>Nota</th></tr></thead>
                  <tbody>
                    {f.creditos.map((c) => (
                      <tr key={c.id}>
                        <td style={{ whiteSpace: "nowrap", color: "var(--tinta-media)" }}>{fechaCorta(c.createdAt.slice(0, 10))}</td>
                        <td>{MOTIVO_CREDITO[c.reason] ?? c.reason}</td>
                        <td className="num">
                          <b style={{ color: c.delta > 0 ? "var(--verde)" : c.delta < 0 ? "var(--rosa)" : "var(--tinta-suave)" }}>
                            {c.delta > 0 ? `+${c.delta}` : c.delta === 0 ? "0" : c.delta}
                          </b>
                        </td>
                        <td style={{ color: "var(--tinta-suave)", fontSize: 13 }}>{c.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "Pagos" && (
            f.ordenes.length === 0 ? <Vacio titulo="Sin compras registradas" /> : (
              <div className="pp-tabla-scroll">
                <table className="pp-tabla">
                  <thead><tr><th>Orden</th><th>Fecha</th><th>Estado</th><th className="num">Monto</th></tr></thead>
                  <tbody>
                    {f.ordenes.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{o.orderNumber}</td>
                        <td style={{ color: "var(--tinta-media)" }}>{fechaCorta((o.paidAt ?? o.createdAt).slice(0, 10))}</td>
                        <td><Badge tono={o.status === "paid" ? "ok" : o.status === "failed" ? "mal" : ""}>{ESTADO_ORDEN[o.status]}</Badge></td>
                        <td className="num"><b>{clp(o.totalClp)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </Tarjeta>

      {modal === "plan" && (
        <Modal
          titulo="Dar un plan a esta alumna"
          onCerrar={() => setModal(null)}
          pie={
            <>
              <button className="pp-btn" onClick={() => setModal(null)}>Cancelar</button>
              <button className="pp-btn primario" onClick={() => void otorgarPlan()} disabled={!planSlug}>Otorgar plan</button>
            </>
          }
        >
          <p style={{ color: "var(--tinta-media)", marginBottom: 16 }}>
            Para cuando te pagan en efectivo o por transferencia. Los créditos quedan disponibles al instante.
          </p>
          <label className="pp-campo">
            <span>Plan</span>
            <select className="pp-select" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)}>
              <option value="">Elige un plan…</option>
              {planes.map((pl) => (
                <option key={pl.slug} value={pl.slug}>{pl.name} — {pl.credits} créditos — {clp(pl.priceClp)}</option>
              ))}
            </select>
          </label>
        </Modal>
      )}

      {modal === "creditos" && (
        <Modal
          titulo="Ajustar créditos"
          onCerrar={() => setModal(null)}
          pie={
            <>
              <button className="pp-btn" onClick={() => setModal(null)}>Cancelar</button>
              <button className="pp-btn primario" onClick={() => void ajustarCreditos()} disabled={nota.trim().length < 3}>
                Guardar ajuste
              </button>
            </>
          }
        >
          <p style={{ color: "var(--tinta-media)", marginBottom: 16 }}>
            Se suma o resta al plan vigente. Todo ajuste queda en el historial con tu nombre.
          </p>
          <label className="pp-campo">
            <span>Cuántos créditos</span>
            <input className="pp-input" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} />
            <small>Usa negativo para restar. Por ejemplo: -1</small>
          </label>
          <label className="pp-campo">
            <span>Motivo</span>
            <input
              className="pp-input"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Cortesía por clase suspendida"
            />
            <small>Obligatorio: es lo que verás en el historial dentro de seis meses.</small>
          </label>
        </Modal>
      )}
    </AdminShell>
  );
}
