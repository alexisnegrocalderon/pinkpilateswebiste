import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Lock, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { clp } from "@/lib/format";
import { Alerta, Cargando } from "@/components/pp/base";

type Token = { orderId: string; orderNumber: string; amountClp: number };

/**
 * Pagador simulado. Imita deliberadamente la pantalla de una pasarela chilena
 * para que la demostración se vea como el flujo real: el navegador sale del
 * sitio, paga, y vuelve con la confirmación llegando por webhook firmado.
 */
export default function PagoMock() {
  const [, params] = useRoute("/pagar/mock/:token");
  const [, navegar] = useLocation();
  const [t, setT] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [medio, setMedio] = useState("credito");

  useEffect(() => {
    if (params?.token) api.get<Token>(`/payments/mock/${params.token}`).then(setT, (e) => setError(e.message));
  }, [params?.token]);

  async function resolver(resultado: "approved" | "rejected") {
    setProcesando(resultado);
    try {
      const r = await api.post<{ returnUrl: string }>(`/payments/mock/${params!.token}/${resultado}`);
      navegar(r.returnUrl);
    } catch (e) {
      setError((e as Error).message);
      setProcesando(null);
    }
  }

  if (error) return <div className="pp-app" style={{ padding: 24 }}><Alerta tono="mal">{error}</Alerta></div>;
  if (!t) return <div className="pp-app"><Cargando que="el pago" /></div>;

  return (
    <div style={{
      minHeight: "100vh", background: "#1F2937", display: "grid", placeItems: "center", padding: 20,
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    }}>
      <div style={{ width: "min(420px, 100%)", background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
        <div style={{ background: "#111827", color: "#fff", padding: "18px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Pago seguro</div>
            <div style={{ fontSize: 11.5, opacity: .65 }}>Entorno de demostración</div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ fontSize: 12.5, color: "#6B7280", letterSpacing: ".07em", textTransform: "uppercase", fontWeight: 600 }}>
              Total a pagar
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.03em", color: "#111827", marginTop: 4 }}>
              {clp(t.amountClp)}
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
              Pink Pilates · orden {t.orderNumber}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>Medio de pago</div>
            <div style={{ display: "grid", gap: 8 }}>
              {[
                { id: "credito", texto: "Tarjeta de crédito" },
                { id: "debito", texto: "Tarjeta de débito" },
                { id: "transferencia", texto: "Transferencia bancaria" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMedio(m.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10,
                    border: `1.5px solid ${medio === m.id ? "#111827" : "#E5E7EB"}`,
                    background: medio === m.id ? "#F9FAFB" : "#fff", cursor: "pointer",
                    fontSize: 14.5, textAlign: "left", width: "100%", minHeight: 46,
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%", flex: "0 0 auto",
                    border: `2px solid ${medio === m.id ? "#111827" : "#D1D5DB"}`,
                    background: medio === m.id ? "#111827" : "#fff",
                    boxShadow: medio === m.id ? "inset 0 0 0 3px #fff" : undefined,
                  }} />
                  {m.texto}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => void resolver("approved")}
            disabled={Boolean(procesando)}
            style={{
              width: "100%", padding: "14px", borderRadius: 10, border: 0, background: "#059669",
              color: "#fff", fontSize: 15.5, fontWeight: 700, cursor: "pointer", minHeight: 50,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: procesando ? .6 : 1,
            }}
          >
            <Lock size={17} />
            {procesando === "approved" ? "Procesando pago…" : `Pagar ${clp(t.amountClp)}`}
          </button>

          <button
            onClick={() => void resolver("rejected")}
            disabled={Boolean(procesando)}
            style={{
              width: "100%", padding: "12px", borderRadius: 10, marginTop: 10, minHeight: 46,
              border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280",
              fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: procesando ? .6 : 1,
            }}
          >
            {procesando === "rejected" ? "Rechazando…" : "Simular pago rechazado"}
          </button>

          <p style={{ fontSize: 11.5, color: "#9CA3AF", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
            Pasarela de prueba. Recorre el mismo flujo que Mercado Pago, Flow o Webpay:
            redirección, confirmación firmada y vuelta al comercio.
          </p>
        </div>
      </div>
    </div>
  );
}
