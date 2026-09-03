import { useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { clp, ESTADO_ORDEN } from "@/lib/format";
import { Alerta, Cargando, Tarjeta, TarjetaCabecera } from "@/components/pp/base";

type Orden = {
  id: string; orderNumber: string; status: string; subtotalClp: number; discountClp: number;
  totalClp: number; items: Array<{ description: string; totalClp: number }> | null;
};

export default function Checkout() {
  const [, params] = useRoute("/checkout/:id");
  const [, navegar] = useLocation();
  const [o, setO] = useState<Orden | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (params?.id) api.get<Orden>(`/orders/${params.id}`).then(setO, (e) => setError(e.message));
  }, [params?.id]);

  async function pagar() {
    setOcupado(true);
    try {
      const r = await api.post<{ redirectUrl: string }>(`/orders/${params!.id}/checkout`);
      navegar(r.redirectUrl);
    } catch (e) {
      setError((e as Error).message);
      setOcupado(false);
    }
  }

  if (error) return <div className="pp-app" style={{ padding: 24 }}><Alerta tono="mal">{error}</Alerta></div>;
  if (!o) return <div className="pp-app"><Cargando que="tu orden" /></div>;

  return (
    <div className="pp-app" style={{ display: "grid", placeItems: "start center", padding: "40px 20px", minHeight: "100vh" }}>
      <div style={{ width: "min(460px, 100%)" }}>
        <h1 style={{ fontSize: 24, fontWeight: 750, letterSpacing: "-.03em", marginBottom: 6 }}>Confirma tu compra</h1>
        <p style={{ color: "var(--tinta-suave)", marginBottom: 22, fontSize: 14.5 }}>Orden {o.orderNumber}</p>

        <Tarjeta>
          <TarjetaCabecera titulo="Resumen" />
          <div className="pp-tarjeta-cuerpo">
            {(o.items ?? []).map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 15 }}>
                <span>{it.description}</span>
                <b>{clp(it.totalClp)}</b>
              </div>
            ))}
            {o.discountClp > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "var(--verde)" }}>
                <span>Descuento</span>
                <b>−{clp(o.discountClp)}</b>
              </div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", paddingTop: 14,
              borderTop: "1px solid var(--linea)", fontSize: 19, fontWeight: 750, letterSpacing: "-.02em",
            }}>
              <span>Total</span>
              <span>{clp(o.totalClp)}</span>
            </div>

            {o.status === "paid" ? (
              <div style={{ marginTop: 18 }}>
                <Alerta tono="ok">
                  Esta orden ya está pagada.{" "}
                  <Link href="/mi" style={{ color: "inherit", fontWeight: 700 }}>Ir a mi cuenta →</Link>
                </Alerta>
              </div>
            ) : (
              <>
                <button className="pp-btn primario ancho" style={{ marginTop: 18 }} onClick={() => void pagar()} disabled={ocupado}>
                  <Lock size={16} /> {ocupado ? "Conectando…" : `Pagar ${clp(o.totalClp)}`}
                </button>
                <p style={{ fontSize: 12.5, color: "var(--tinta-suave)", textAlign: "center", marginTop: 12 }}>
                  Te llevamos a la pasarela de pago para completar la transacción.
                </p>
              </>
            )}
          </div>
        </Tarjeta>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 13.5 }}>
          <Link href="/planes" style={{ color: "var(--tinta-suave)" }}>← Volver a los planes</Link>
        </p>
      </div>
    </div>
  );
}
