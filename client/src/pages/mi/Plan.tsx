import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { clp, ESTADO_MEMBRESIA, fechaCorta, MOTIVO_CREDITO } from "@/lib/format";
import StudentShell from "@/components/pp/StudentShell";
import { Badge, BarraCupo, Cargando, Tarjeta, TarjetaCabecera, Vacio } from "@/components/pp/base";

type Membresia = {
  id: string; planName: string; segment: string; status: string; creditsTotal: number;
  creditsUsed: number; creditsRemaining: number; startsOn: string; endsOn: string; pricePaidClp: number;
};
type Movimiento = {
  id: number; delta: number; reason: string; note: string | null; createdAt: string;
  className: string | null; localDate: string | null;
};

export default function MiPlan() {
  const [ms, setMs] = useState<Membresia[] | null>(null);
  const [mov, setMov] = useState<Movimiento[]>([]);

  useEffect(() => {
    api.get<Membresia[]>("/me/memberships").then(setMs);
    api.get<Movimiento[]>("/me/credits").then(setMov);
  }, []);

  if (!ms) return <StudentShell titulo="Mi plan"><Cargando /></StudentShell>;

  const vigente = ms.find((m) => m.status === "active");

  return (
    <StudentShell
      titulo="Mi plan"
      sub="Tus créditos y todo lo que has comprado"
      acciones={<Link href="/planes" className="pp-btn chico primario">Comprar otro plan</Link>}
    >
      {vigente ? (
        <Tarjeta style={{ marginBottom: 18 }}>
          <TarjetaCabecera titulo={vigente.planName} sub={`Vigente hasta el ${fechaCorta(vigente.endsOn)}`} />
          <div className="pp-tarjeta-cuerpo">
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 42, fontWeight: 750, letterSpacing: "-.04em", lineHeight: 1 }}>
                {vigente.creditsRemaining}
              </span>
              <span style={{ color: "var(--tinta-suave)" }}>de {vigente.creditsTotal} créditos disponibles</span>
            </div>
            <BarraCupo usado={vigente.creditsUsed} total={vigente.creditsTotal} />
          </div>
        </Tarjeta>
      ) : (
        <Tarjeta style={{ marginBottom: 18 }}>
          <Vacio titulo="No tienes un plan activo">
            <Link href="/planes" style={{ color: "var(--rosa)", fontWeight: 700 }}>Mira los planes disponibles →</Link>
          </Vacio>
        </Tarjeta>
      )}

      <Tarjeta style={{ marginBottom: 18 }}>
        <TarjetaCabecera titulo="Movimientos de créditos" sub="Cada clase reservada, cancelada y devuelta" />
        <div className="pp-tarjeta-cuerpo sin-relleno">
          {mov.length === 0 ? <Vacio titulo="Sin movimientos todavía" /> : (
            <div className="pp-tabla-scroll">
              <table className="pp-tabla">
                <thead><tr><th>Fecha</th><th>Movimiento</th><th className="num">Créditos</th></tr></thead>
                <tbody>
                  {mov.map((m) => (
                    <tr key={m.id}>
                      <td style={{ whiteSpace: "nowrap", color: "var(--tinta-media)" }}>{fechaCorta(m.createdAt.slice(0, 10))}</td>
                      <td>
                        {MOTIVO_CREDITO[m.reason] ?? m.reason}
                        {m.className && <div style={{ fontSize: 12.5, color: "var(--tinta-suave)" }}>{m.className}</div>}
                      </td>
                      <td className="num">
                        <b style={{ color: m.delta > 0 ? "var(--verde)" : m.delta < 0 ? "var(--rosa)" : "var(--tinta-suave)" }}>
                          {m.delta > 0 ? `+${m.delta}` : m.delta === 0 ? "0" : m.delta}
                        </b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <TarjetaCabecera titulo="Historial de planes" />
        <div className="pp-tarjeta-cuerpo sin-relleno">
          <div className="pp-tabla-scroll">
            <table className="pp-tabla">
              <thead><tr><th>Plan</th><th>Estado</th><th className="num">Créditos</th><th>Vigencia</th><th className="num">Pagado</th></tr></thead>
              <tbody>
                {ms.map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.planName}</b></td>
                    <td><Badge tono={m.status === "active" ? "ok" : m.status === "pending_verification" ? "aviso" : ""}>{ESTADO_MEMBRESIA[m.status]}</Badge></td>
                    <td className="num">{m.creditsRemaining} / {m.creditsTotal}</td>
                    <td style={{ color: "var(--tinta-media)", whiteSpace: "nowrap" }}>{fechaCorta(m.startsOn)} → {fechaCorta(m.endsOn)}</td>
                    <td className="num">{clp(m.pricePaidClp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Tarjeta>
    </StudentShell>
  );
}
