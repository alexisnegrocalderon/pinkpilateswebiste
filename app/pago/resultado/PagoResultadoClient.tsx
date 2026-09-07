"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { clp } from "@/lib/format";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";

type Orden = {
  id: string; orderNumber: string; status: string; totalClp: number;
  items: Array<{ description: string }> | null;
};

/**
 * El pago se confirma por webhook, que llega de forma asíncrona: se consulta
 * hasta que el estado deje de estar pendiente.
 */
export default function PagoResultadoClient() {
  const orderId = useSearchParams().get("orderId");
  const [o, setO] = useState<Orden | null>(null);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let vivo = true;
    const revisar = async () => {
      const d = await api.get<Orden>(`/public/checkout/orders/${orderId}`);
      if (!vivo) return;
      setO(d);
      if (d.status === "awaiting_payment" && intentos < 12) {
        setTimeout(() => setIntentos((n) => n + 1), 1200);
      }
    };
    void revisar();
    return () => {
      vivo = false;
    };
  }, [orderId, intentos]);

  return (
    <>
      <SiteHeader />
      <main className="grid min-h-[70vh] place-items-center bg-[#FFF5F5] px-5 py-16">
        <div className="w-full max-w-[430px] rounded-3xl bg-white p-8 text-center shadow-sm">
          {!o ? (
            <p className="text-[14px] text-neutral-500">Confirmando tu pago…</p>
          ) : o.status === "awaiting_payment" ? (
            <>
              <p className="text-[15px] font-semibold text-neutral-900">Confirmando tu pago…</p>
              <p className="mt-2 text-[13.5px] text-neutral-500">
                Estamos esperando la confirmación de la pasarela. No cierres esta ventana.
              </p>
            </>
          ) : o.status === "paid" ? (
            <>
              <CheckCircle2 size={52} className="mx-auto mb-4 text-emerald-500" />
              <h1 className="text-[22px] font-bold tracking-tight text-neutral-900">¡Listo! Tu plan ya está activo</h1>
              <p className="mt-2 text-[14.5px] text-neutral-600">
                {o.items?.[0]?.description} — {clp(o.totalClp)}
              </p>
              <p className="mt-1 text-[13px] text-neutral-500">Orden {o.orderNumber}. Te enviamos el comprobante por correo.</p>
              <Link
                href="/planes"
                className="mt-6 block rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#e14c76]"
              >
                Ver mis planes
              </Link>
            </>
          ) : (
            <>
              <XCircle size={52} className="mx-auto mb-4 text-red-500" />
              <h1 className="text-[22px] font-bold tracking-tight text-neutral-900">El pago no se completó</h1>
              <p className="mt-2 text-[14.5px] text-neutral-600">No se te cobró nada. Puedes intentarlo de nuevo cuando quieras.</p>
              <Link
                href="/planes"
                className="mt-6 block rounded-full bg-[#FF5C89] px-6 py-3 text-[14px] font-semibold text-white hover:bg-[#e14c76]"
              >
                Volver a los planes
              </Link>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
