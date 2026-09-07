import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Alerta } from "@/components/pp/base";
import { Link } from "@/components/NavLink";

/** Login único para el admin (Javiera) — ya no hay cuentas de alumnas. */
export default function Ingresar() {
  const { entrar } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOcupado(true);
    try {
      await entrar(email, password);
      window.location.href = "/admin";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="pp-app" style={{ display: "grid", placeItems: "center", padding: 20, minHeight: "100vh" }}>
      <div style={{ width: "min(400px, 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <img
              src="/assets/pink/pink-pilates-isotipo.png"
              alt="Pink Pilates"
              style={{ width: 50, height: 50, margin: "0 auto 14px", display: "block" }}
            />
          </Link>
          <h1 style={{ fontSize: 25, fontWeight: 750, letterSpacing: "-.03em" }}>Panel Pink Pilates</h1>
          <p style={{ color: "var(--tinta-suave)", marginTop: 6, fontSize: 14.5 }}>
            Precios, clases y contactos
          </p>
        </div>

        <div className="pp-tarjeta">
          <form className="pp-tarjeta-cuerpo" onSubmit={enviar}>
            {error && <div style={{ marginBottom: 16 }}><Alerta tono="mal">{error}</Alerta></div>}

            <label className="pp-campo">
              <span>Email</span>
              <input
                className="pp-input" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              />
            </label>
            <label className="pp-campo">
              <span>Contraseña</span>
              <input
                className="pp-input" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
              />
            </label>

            <button className="pp-btn primario ancho" type="submit" disabled={ocupado} style={{ marginTop: 6 }}>
              {ocupado ? "Un momento…" : "Entrar"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: 10, fontSize: 13.5 }}>
          <Link href="/" style={{ color: "var(--tinta-suave)" }}>← Volver al sitio</Link>
        </p>
      </div>
    </div>
  );
}
