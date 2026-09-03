import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { diaCorto, diaNumero, fechaRelativa, hora, hoyEnSantiago } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import StudentShell from "@/components/pp/StudentShell";
import { Alerta, Badge, Cargando, Cupo, Modal, Tarjeta, Vacio } from "@/components/pp/base";

type Clase = {
  id: string; localDate: string; startTime: string; capacity: number; bookedCount: number;
  waitlistCount: number; spotsLeft: number; isFull: boolean; className: string; classTypeId: string;
  color: string; roomName: string; instructorName: string; dropInPriceClp: number;
  bookingClosed: boolean;
};

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function Reservar() {
  const hoy = hoyEnSantiago();
  const { usuario, cargando } = useAuth();
  const [, navegar] = useLocation();
  const [dia, setDia] = useState(hoy);
  const [tipo, setTipo] = useState("");
  const [clases, setClases] = useState<Clase[] | null>(null);
  const [aviso, setAviso] = useState<{ tono: "ok" | "mal" | "aviso"; texto: string; accion?: { texto: string; href: string } } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  const dias = Array.from({ length: 14 }, (_, i) => addDays(hoy, i));

  const cargar = useCallback(() => {
    api.get<Clase[]>(`/public/schedule?from=${hoy}&to=${addDays(hoy, 14)}`).then(setClases);
  }, [hoy]);
  useEffect(cargar, [cargar]);

  const tipos = [...new Map((clases ?? []).map((c) => [c.classTypeId, c.className])).entries()];
  const delDia = (clases ?? []).filter((c) => c.localDate === dia && (!tipo || c.classTypeId === tipo));

  async function reservar(c: Clase) {
    if (!usuario) return navegar("/ingresar");
    setOcupado(c.id);
    setAviso(null);
    try {
      const r = await api.post<{ message: string }>("/bookings", { sessionId: c.id });
      setAviso({ tono: "ok", texto: r.message });
      cargar();
    } catch (e) {
      const err = e as ApiError;
      // Cada error de dominio ofrece la salida concreta, no un mensaje seco.
      const accion =
        err.code === "NO_ACTIVE_PLAN" || err.code === "NO_CREDITS"
          ? { texto: "Ver planes", href: "/planes" }
          : undefined;
      setAviso({ tono: err.code === "SESSION_FULL" ? "aviso" : "mal", texto: err.message, accion });
      if (err.code === "SESSION_FULL") cargar();
    } finally {
      setOcupado(null);
    }
  }

  async function esperar(c: Clase) {
    if (!usuario) return navegar("/ingresar");
    setOcupado(c.id);
    try {
      const r = await api.post<{ position: number; warning: string | null }>(`/sessions/${c.id}/waitlist`);
      setAviso({
        tono: "ok",
        texto: `Estás en la lista de espera, en el lugar ${r.position}. Si se libera un cupo entras sola y te avisamos.${r.warning ? ` ${r.warning}` : ""}`,
      });
      cargar();
    } catch (e) {
      setAviso({ tono: "mal", texto: (e as ApiError).message });
    } finally {
      setOcupado(null);
    }
  }

  const contenido = (
    <>
      {aviso && (
        <div style={{ marginBottom: 16 }}>
          <Alerta tono={aviso.tono}>
            {aviso.texto}
            {aviso.accion && (
              <> <Link href={aviso.accion.href} style={{ color: "inherit", fontWeight: 700 }}>{aviso.accion.texto} →</Link></>
            )}
          </Alerta>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 14 }}>
        {dias.map((d) => (
          <button
            key={d}
            onClick={() => setDia(d)}
            aria-pressed={dia === d}
            style={{
              flex: "0 0 auto", minWidth: 64, padding: "10px 12px", borderRadius: 12, cursor: "pointer",
              border: `1px solid ${dia === d ? "var(--rosa)" : "var(--linea-fuerte)"}`,
              background: dia === d ? "var(--rosa)" : "var(--papel)",
              color: dia === d ? "#fff" : "var(--tinta)", textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", opacity: .8 }}>{diaCorto(d)}</div>
            <div style={{ fontSize: 19, fontWeight: 750, letterSpacing: "-.02em" }}>{diaNumero(d)}</div>
          </button>
        ))}
      </div>

      {tipos.length > 1 && (
        <div className="pp-filtros" style={{ marginBottom: 16 }}>
          <button className="pp-chip" aria-pressed={!tipo} onClick={() => setTipo("")}>Todas</button>
          {tipos.map(([id, nombre]) => (
            <button key={id} className="pp-chip" aria-pressed={tipo === id} onClick={() => setTipo(id)}>{nombre}</button>
          ))}
        </div>
      )}

      <Tarjeta>
        {!clases ? <Cargando que="la agenda" /> : delDia.length === 0 ? (
          <Vacio titulo={`Sin clases el ${fechaRelativa(dia, hoy)}`}>Prueba otro día de la semana.</Vacio>
        ) : (
          <div className="pp-tarjeta-cuerpo sin-relleno">
            {delDia.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "16px 18px", borderBottom: "1px solid var(--linea)", display: "flex",
                  gap: 14, alignItems: "center", flexWrap: "wrap", opacity: c.bookingClosed ? 0.5 : 1,
                }}
              >
                <div style={{ fontSize: 19, fontWeight: 750, fontVariantNumeric: "tabular-nums", minWidth: 62 }}>
                  {hora(c.startTime)}
                </div>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <b style={{ fontSize: 15.5, display: "flex", alignItems: "center", gap: 8 }}>
                    <i style={{ width: 8, height: 8, borderRadius: 3, background: c.color, display: "inline-block" }} />
                    {c.className}
                  </b>
                  <div style={{ fontSize: 13.5, color: "var(--tinta-suave)" }}>{c.instructorName} · {c.roomName}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {c.bookingClosed ? (
                    <Badge>Ya cerrada</Badge>
                  ) : c.isFull ? (
                    <Badge tono="mal">Llena{c.waitlistCount > 0 && ` · ${c.waitlistCount} esperando`}</Badge>
                  ) : (
                    <Badge tono={c.spotsLeft <= 1 ? "aviso" : "ok"}>
                      {c.spotsLeft === 1 ? "Último cupo" : `${c.spotsLeft} cupos`}
                    </Badge>
                  )}
                  {c.bookingClosed ? null : c.isFull ? (
                    <button className="pp-btn chico" disabled={ocupado === c.id} onClick={() => void esperar(c)}>
                      Lista de espera
                    </button>
                  ) : (
                    <button className="pp-btn chico primario" disabled={ocupado === c.id} onClick={() => void reservar(c)}>
                      {ocupado === c.id ? "…" : "Reservar"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Tarjeta>
    </>
  );

  if (cargando) return <div className="pp-app"><Cargando /></div>;

  // Con sesión se muestra dentro del portal; sin sesión, como página suelta.
  if (usuario) {
    return <StudentShell titulo="Reservar" sub="Elige tu clase">{contenido}</StudentShell>;
  }

  return (
    <div className="pp-app">
      <header className="pp-cabecera">
        <div>
          <h1>Reservar una clase</h1>
          <p>Entra a tu cuenta para tomar tu cupo</p>
        </div>
        <div className="pp-cabecera-acciones">
          <Link href="/planes" className="pp-btn chico">Ver planes</Link>
          <Link href="/ingresar" className="pp-btn chico primario">Entrar</Link>
        </div>
      </header>
      <main className="pp-contenido">{contenido}</main>
    </div>
  );
}
