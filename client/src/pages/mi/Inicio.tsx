import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CalendarDays, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { fechaRelativa, hora, hoyEnSantiago } from "@/lib/format";
import StudentShell from "@/components/pp/StudentShell";
import { Alerta, Badge, BarraCupo, Cargando, Tarjeta, TarjetaCabecera, Vacio } from "@/components/pp/base";
import { useAuth } from "@/lib/auth";

type Panel = {
  memberships: Array<{ id: string; planName: string; segment: string; creditsTotal: number; creditsUsed: number;
    creditsRemaining: number; endsOn: string; status: string; daysLeft: number;
    allowedWeekdays: number[] | null; allowedTimeFrom: string | null; allowedTimeTo: string | null }>;
  upcoming: Array<{ id: string; sessionId: string; localDate: string; startTime: string;
    className: string; instructorName: string; roomName: string }>;
  waitlist: Array<{ id: string; sessionId: string; localDate: string; startTime: string; className: string; status: string }>;
};

export default function MiInicio() {
  const { usuario } = useAuth();
  const [d, setD] = useState<Panel | null>(null);
  const hoy = hoyEnSantiago();

  useEffect(() => { api.get<Panel>("/me/dashboard").then(setD); }, []);

  if (!d) return <StudentShell titulo="Hola"><Cargando /></StudentShell>;

  const activo = d.memberships.find((m) => m.status === "active");
  const porVerificar = d.memberships.find((m) => m.status === "pending_verification");

  return (
    <StudentShell
      titulo={`Hola, ${usuario?.firstName}`}
      sub="Tu plan y tus próximas clases"
      acciones={<Link href="/reservar" className="pp-btn primario">Reservar una clase</Link>}
    >
      {porVerificar && (
        <div style={{ marginBottom: 18 }}>
          <Alerta tono="aviso">
            Tu plan <b>{porVerificar.planName}</b> está esperando que el estudio verifique tu certificado de
            alumno regular. Apenas lo aprueben podrás usar tus {porVerificar.creditsTotal} créditos.
          </Alerta>
        </div>
      )}

      {!activo && !porVerificar && (
        <div style={{ marginBottom: 18 }}>
          <Alerta tono="info">
            No tienes un plan activo.{" "}
            <Link href="/planes" style={{ color: "var(--rosa)", fontWeight: 700 }}>Mira los planes disponibles →</Link>
          </Alerta>
        </div>
      )}

      <div className="pp-grilla pp-grilla-2" style={{ marginBottom: 18 }}>
        {activo && (
          <Tarjeta>
            <TarjetaCabecera titulo={activo.planName} sub={`Vence el ${fechaRelativa(activo.endsOn, hoy) === "hoy" ? "hoy" : activo.endsOn}`} />
            <div className="pp-tarjeta-cuerpo">
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 42, fontWeight: 750, letterSpacing: "-.04em", lineHeight: 1 }}>
                  {activo.creditsRemaining}
                </span>
                <span style={{ color: "var(--tinta-suave)", fontSize: 15 }}>
                  de {activo.creditsTotal} créditos disponibles
                </span>
              </div>
              <BarraCupo usado={activo.creditsUsed} total={activo.creditsTotal} />

              {activo.allowedWeekdays && (
                <div style={{ marginTop: 16 }}>
                  <Alerta tono="info">
                    Tu plan valle sirve de lunes a viernes entre las {hora(activo.allowedTimeFrom ?? "")} y
                    las {hora(activo.allowedTimeTo ?? "")}.
                  </Alerta>
                </div>
              )}

              {activo.daysLeft <= 7 && (
                <div style={{ marginTop: 14 }}>
                  <Alerta tono="aviso">
                    Tu plan vence en {activo.daysLeft} día{activo.daysLeft === 1 ? "" : "s"}
                    {activo.creditsRemaining > 0 && ` y te quedan ${activo.creditsRemaining} créditos sin usar`}.
                  </Alerta>
                </div>
              )}
            </div>
          </Tarjeta>
        )}

        <Tarjeta>
          <TarjetaCabecera
            titulo="Tus próximas clases"
            acciones={<Link href="/mi/reservas" className="pp-btn chico">Ver todas</Link>}
          />
          <div className="pp-tarjeta-cuerpo sin-relleno">
            {d.upcoming.length === 0 ? (
              <Vacio titulo="No tienes clases reservadas">
                Elige un horario y toma tu cupo antes de que se llene.
              </Vacio>
            ) : (
              d.upcoming.map((c) => (
                <div key={c.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--linea)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      background: "var(--rosa-palido)", color: "var(--rosa)", borderRadius: 10,
                      padding: "8px 11px", textAlign: "center", minWidth: 60, flex: "0 0 auto",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
                        {fechaRelativa(c.localDate, hoy)}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 750, fontVariantNumeric: "tabular-nums" }}>{hora(c.startTime)}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <b style={{ fontSize: 15 }}>{c.className}</b>
                      <div style={{ fontSize: 13, color: "var(--tinta-suave)" }}>
                        {c.instructorName} · {c.roomName}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tarjeta>
      </div>

      {d.waitlist.length > 0 && (
        <Tarjeta>
          <TarjetaCabecera titulo="Estás en lista de espera" sub="Si se libera un cupo, entras sola y te avisamos por correo" />
          <div className="pp-tarjeta-cuerpo sin-relleno">
            {d.waitlist.map((w) => (
              <div key={w.id} style={{ padding: "13px 18px", borderBottom: "1px solid var(--linea)", display: "flex", gap: 10, alignItems: "center" }}>
                <Clock size={17} style={{ color: "var(--ambar)" }} />
                <div>
                  <b>{w.className}</b>
                  <div style={{ fontSize: 13, color: "var(--tinta-suave)" }}>
                    {fechaRelativa(w.localDate, hoy)} a las {hora(w.startTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Tarjeta>
      )}
    </StudentShell>
  );
}
