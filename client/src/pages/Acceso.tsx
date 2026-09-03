import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Alerta } from "@/components/pp/base";

/** Login y registro comparten marco: una sola pantalla con dos modos. */
export default function Acceso({ modo }: { modo: "entrar" | "crear" }) {
  const { entrar, registrarse } = useAuth();
  const [, navegar] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [f, setF] = useState({
    email: "", password: "", firstName: "", lastName: "", phone: "",
    emergencyContactName: "", emergencyContactPhone: "", healthNotes: "",
  });

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      const u = modo === "entrar"
        ? await entrar(f.email, f.password)
        : await registrarse({
            email: f.email, password: f.password, firstName: f.firstName, lastName: f.lastName,
            phone: f.phone || undefined,
            emergencyContactName: f.emergencyContactName || undefined,
            emergencyContactPhone: f.emergencyContactPhone || undefined,
            healthNotes: f.healthNotes || undefined,
          });
      navegar(u.role === "student" ? "/mi" : "/panel");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="pp-app" style={{ display: "grid", placeItems: "center", padding: 20, minHeight: "100vh" }}>
      <div style={{ width: "min(430px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{
              width: 50, height: 50, borderRadius: 15, background: "var(--rosa)", color: "#fff",
              display: "grid", placeItems: "center", fontWeight: 800, fontSize: 23, margin: "0 auto 14px",
            }}>P</div>
          </Link>
          <h1 style={{ fontSize: 25, fontWeight: 750, letterSpacing: "-.03em" }}>
            {modo === "entrar" ? "Entra a tu cuenta" : "Crea tu cuenta"}
          </h1>
          <p style={{ color: "var(--tinta-suave)", marginTop: 6, fontSize: 14.5 }}>
            {modo === "entrar" ? "Para reservar tus clases y ver tus créditos" : "Toma tu primera clase en Pink Pilates"}
          </p>
        </div>

        <div className="pp-tarjeta">
          <form className="pp-tarjeta-cuerpo" onSubmit={enviar}>
            {error && <div style={{ marginBottom: 16 }}><Alerta tono="mal">{error}</Alerta></div>}

            {modo === "crear" && (
              <div className="pp-fila">
                <label className="pp-campo">
                  <span>Nombre</span>
                  <input className="pp-input" value={f.firstName} onChange={set("firstName")} required autoComplete="given-name" />
                </label>
                <label className="pp-campo">
                  <span>Apellido</span>
                  <input className="pp-input" value={f.lastName} onChange={set("lastName")} required autoComplete="family-name" />
                </label>
              </div>
            )}

            <label className="pp-campo">
              <span>Email</span>
              <input className="pp-input" type="email" value={f.email} onChange={set("email")} required autoComplete="email" />
            </label>

            <label className="pp-campo">
              <span>Contraseña</span>
              <input
                className="pp-input" type="password" value={f.password} onChange={set("password")}
                required minLength={modo === "crear" ? 8 : 1}
                autoComplete={modo === "crear" ? "new-password" : "current-password"}
              />
              {modo === "crear" && <small>Al menos 8 caracteres.</small>}
            </label>

            {modo === "crear" && (
              <>
                <label className="pp-campo">
                  <span>Teléfono</span>
                  <input className="pp-input" value={f.phone} onChange={set("phone")} placeholder="9 1234 5678" autoComplete="tel" />
                </label>
                <div className="pp-fila">
                  <label className="pp-campo">
                    <span>Contacto de emergencia</span>
                    <input className="pp-input" value={f.emergencyContactName} onChange={set("emergencyContactName")} />
                  </label>
                  <label className="pp-campo">
                    <span>Su teléfono</span>
                    <input className="pp-input" value={f.emergencyContactPhone} onChange={set("emergencyContactPhone")} />
                  </label>
                </div>
                <label className="pp-campo">
                  <span>¿Algo que debamos saber?</span>
                  <textarea
                    className="pp-textarea" style={{ minHeight: 80 }}
                    value={f.healthNotes} onChange={set("healthNotes")}
                    placeholder="Lesiones, embarazo, cirugías recientes…"
                  />
                  <small>Lo ve sólo tu instructora, para cuidarte mejor.</small>
                </label>
              </>
            )}

            <button className="pp-btn primario ancho" type="submit" disabled={ocupado} style={{ marginTop: 6 }}>
              {ocupado ? "Un momento…" : modo === "entrar" ? "Entrar" : "Crear mi cuenta"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 14.5, color: "var(--tinta-suave)" }}>
          {modo === "entrar" ? (
            <>¿Primera vez? <Link href="/crear-cuenta" style={{ color: "var(--rosa)", fontWeight: 600 }}>Crea tu cuenta</Link></>
          ) : (
            <>¿Ya tienes cuenta? <Link href="/ingresar" style={{ color: "var(--rosa)", fontWeight: 600 }}>Entra aquí</Link></>
          )}
        </p>
        <p style={{ textAlign: "center", marginTop: 10, fontSize: 13.5 }}>
          <Link href="/" style={{ color: "var(--tinta-suave)" }}>← Volver al sitio</Link>
        </p>
      </div>
    </div>
  );
}
