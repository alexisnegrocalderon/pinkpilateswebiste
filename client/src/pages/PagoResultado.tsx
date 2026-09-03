import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { clp } from "@/lib/format";
import { Cargando, Tarjeta } from "@/components/pp/base";

type Orden = { id: string; orderNumber: string; status: string; totalClp: number;
  items: Array<{ description: string }> | null };

export default function PagoResultado() {
  const orderId = new URLSearchParams(window.location.search).get("orderId");
  const [o, setO] = useState<Orden | null>(null);
  const [intentos, setIntentos] = useState(0);

  // El pago se confirma por webhook, que llega de forma asíncrona: se consulta
  // hasta que el estado deje de estar pendiente.
  useEffect(() => {
    if (!orderId) return;
    let vivo = true;
    const revisar = async () => {
      const d = await api.get<Orden>(`/orders/${orderId}`);
      if (!vivo) return;
      setO(d);
      if (d.status === "awaiting_payment" && intentos < 12) {
        setTimeout(() => setIntentos((n) => n + 1), 1200);
      }
    };
    void revisar();
    return () => { vivo = false; };
  }, [orderId, intentos]);

  if (!o) return <div className="pp-app"><Cargando que="tu pago" /></div>;

  const pagada = o.status === "paid";
  const pendiente = o.status === "awaiting_payment";

  return (
    <div className="pp-app" style={{ display: "grid", placeItems: "center", padding: 20, minHeight: "100vh" }}>
      <div style={{ width: "min(430px, 100%)" }}>
        <Tarjeta>
          <div className="pp-tarjeta-cuerpo" style={{ textAlign: "center", padding: 32 }}>
            {pendiente ? (
              <>
                <div className="pp-cargando" style={{ padding: 12 }}>Confirmando tu pago…</div>
                <p style={{ color: "var(--tinta-suave)", fontSize: 14 }}>
                  Estamos esperando la confirmación de la pasarela. No cierres esta ventana.
                </p>
              </>
            ) : pagada ? (
              <>
                <CheckCircle2 size={52} style={{ color: "var(--verde)", margin: "0 auto 16px", display: "block" }} />
                <h1 style={{ fontSize: 23, fontWeight: 750, letterSpacing: "-.03em", marginBottom: 8 }}>
                  ¡Listo! Tu plan ya está activo
                </h1>
                <p style={{ color: "var(--tinta-media)", marginBottom: 8 }}>
                  {o.items?.[0]?.description} — {clp(o.totalClp)}
                </p>
                <p style={{ color: "var(--tinta-suave)", fontSize: 13.5, marginBottom: 24 }}>
                  Orden {o.orderNumber}. Te enviamos el comprobante por correo.
                </p>
                <Link href="/reservar" className="pp-btn primario ancho">Reservar mi primera clase</Link>
                <Link href="/mi" className="pp-btn ancho" style={{ marginTop: 9 }}>Ir a mi cuenta</Link>
              </>
            ) : (
              <>
                <XCircle size={52} style={{ color: "var(--rojo)", margin: "0 auto 16px", display: "block" }} />
                <h1 style={{ fontSize: 23, fontWeight: 750, letterSpacing: "-.03em", marginBottom: 8 }}>
                  El pago no se completó
                </h1>
                <p style={{ color: "var(--tinta-media)", marginBottom: 24 }}>
                  No se te cobró nada. Puedes intentarlo de nuevo cuando quieras.
                </p>
                <Link href="/planes" className="pp-btn primario ancho">Volver a los planes</Link>
              </>
            )}
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}
