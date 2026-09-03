import type { CSSProperties, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

export function Tarjeta({
  children, className = "", style,
}: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`pp-tarjeta ${className}`} style={style}>{children}</div>;
}

export function TarjetaCabecera({ titulo, sub, acciones }: { titulo: string; sub?: string; acciones?: ReactNode }) {
  return (
    <div className="pp-tarjeta-cabecera">
      <div>
        <h2>{titulo}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {acciones && <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>{acciones}</div>}
    </div>
  );
}

export function Kpi({
  etiqueta, valor, nota, tendencia,
}: { etiqueta: string; valor: ReactNode; nota?: string; tendencia?: "sube" | "baja" }) {
  return (
    <Tarjeta className="pp-kpi">
      <div className="pp-kpi-etiqueta">{etiqueta}</div>
      <div className="pp-kpi-valor">{valor}</div>
      {nota && <div className={`pp-kpi-nota ${tendencia ?? ""}`}>{nota}</div>}
    </Tarjeta>
  );
}

export function Badge({ tono = "", children }: { tono?: string; children: ReactNode }) {
  return <span className={`pp-badge ${tono}`}>{children}</span>;
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="pp-vacio">
      <b>{titulo}</b>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Cargando({ que = "" }: { que?: string }) {
  return <div className="pp-cargando">Cargando {que}…</div>;
}

const ICONOS = { info: Info, ok: CheckCircle2, aviso: TriangleAlert, mal: AlertCircle };

export function Alerta({ tono = "info", children }: { tono?: keyof typeof ICONOS; children: ReactNode }) {
  const Icono = ICONOS[tono];
  return (
    <div className={`pp-alerta ${tono}`}>
      <Icono />
      <div>{children}</div>
    </div>
  );
}

/** Panel lateral. Se cierra con Escape y al tocar fuera. */
export function PanelLateral({
  titulo, sub, onCerrar, pie, children,
}: { titulo: string; sub?: string; onCerrar: () => void; pie?: ReactNode; children: ReactNode }) {
  return (
    <div className="pp-overlay" onClick={onCerrar} role="presentation">
      <div className="pp-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="pp-panel-cabecera">
          <div>
            <h2>{titulo}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button className="pp-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>
        <div className="pp-panel-cuerpo">{children}</div>
        {pie && <div className="pp-panel-pie">{pie}</div>}
      </div>
    </div>
  );
}

export function Modal({
  titulo, onCerrar, pie, children,
}: { titulo: string; onCerrar: () => void; pie?: ReactNode; children: ReactNode }) {
  return (
    <div className="pp-modal-fondo" onClick={onCerrar} role="presentation">
      <div className="pp-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="pp-modal-cuerpo">
          <h2>{titulo}</h2>
          {children}
        </div>
        {pie && <div className="pp-modal-pie">{pie}</div>}
      </div>
    </div>
  );
}

/** Barra de ocupación con el color según qué tan llena está la clase. */
export function BarraCupo({ usado, total }: { usado: number; total: number }) {
  const pct = total ? Math.min(100, Math.round((100 * usado) / total)) : 0;
  const tono = pct >= 100 ? "lleno" : pct >= 60 ? "" : "ok";
  return (
    <div className={`pp-barra ${tono}`} title={`${usado} de ${total}`}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Cupo en formato "3/5", coloreado según disponibilidad. */
export function Cupo({ usado, total }: { usado: number; total: number }) {
  const libres = total - usado;
  const tono = libres <= 0 ? "lleno" : libres <= 1 ? "casi" : "libre";
  return <span className={`pp-cupo ${tono}`}>{usado}/{total}</span>;
}

export const iniciales = (nombre: string, apellido = "") =>
  `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase();
