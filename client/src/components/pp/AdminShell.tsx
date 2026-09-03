import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3, CalendarDays, ClipboardList, CreditCard, LayoutDashboard, LogOut,
  Mail, Menu, Settings, ShieldCheck, Tag, Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { iniciales } from "./base";

const NAV = [
  {
    grupo: "Operación",
    items: [
      { href: "/admin", icono: LayoutDashboard, texto: "Resumen" },
      { href: "/admin/agenda", icono: CalendarDays, texto: "Agenda" },
      { href: "/admin/horarios", icono: ClipboardList, texto: "Horario semanal" },
    ],
  },
  {
    grupo: "Negocio",
    items: [
      { href: "/admin/alumnas", icono: Users, texto: "Alumnas" },
      { href: "/admin/planes", icono: Tag, texto: "Planes y precios" },
      { href: "/admin/pagos", icono: CreditCard, texto: "Pagos" },
    ],
  },
  {
    grupo: "Crecimiento",
    items: [
      { href: "/admin/emails", icono: Mail, texto: "Emails" },
      { href: "/admin/reportes", icono: BarChart3, texto: "Reportes" },
    ],
  },
  {
    grupo: "Estudio",
    items: [
      { href: "/admin/config", icono: Settings, texto: "Configuración" },
      { href: "/admin/auditoria", icono: ShieldCheck, texto: "Historial" },
    ],
  },
];

export default function AdminShell({
  titulo, sub, acciones, children,
}: { titulo: string; sub?: string; acciones?: ReactNode; children: ReactNode }) {
  const [ruta] = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { usuario, salir } = useAuth();

  return (
    <div className="pp-app">
      <div className="pp-shell">
        {menuAbierto && <div className="pp-lateral-fondo" onClick={() => setMenuAbierto(false)} />}

        <aside className={`pp-lateral ${menuAbierto ? "abierta" : ""}`}>
          <div className="pp-marca">
            <div className="pp-marca-icono">P</div>
            <div className="pp-marca-texto">
              <b>Pink Pilates</b>
              <span>Panel</span>
            </div>
          </div>

          {NAV.map((g) => (
            <div key={g.grupo}>
              <div className="pp-nav-grupo">{g.grupo}</div>
              {g.items.map((it) => {
                const Icono = it.icono;
                // Sólo /admin exacto, si no todas las rutas quedarían activas.
                const activo = it.href === "/admin" ? ruta === "/admin" : ruta.startsWith(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className="pp-nav-item"
                    aria-current={activo ? "page" : undefined}
                    onClick={() => setMenuAbierto(false)}
                  >
                    <Icono />
                    {it.texto}
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="pp-lateral-pie">
            <div className="pp-usuario">
              <div className="pp-avatar">{iniciales(usuario?.firstName ?? "", usuario?.lastName ?? "")}</div>
              <div className="pp-usuario-datos">
                <b>{usuario?.firstName} {usuario?.lastName}</b>
                <span>{usuario?.role === "owner" ? "Directora" : "Instructora"}</span>
              </div>
            </div>
            <button className="pp-nav-item" onClick={() => void salir()}>
              <LogOut />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="pp-principal">
          <header className="pp-cabecera">
            <button className="pp-menu-movil" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
              <Menu size={19} />
            </button>
            <div>
              <h1>{titulo}</h1>
              {sub && <p>{sub}</p>}
            </div>
            {acciones && <div className="pp-cabecera-acciones">{acciones}</div>}
          </header>
          <main className="pp-contenido">{children}</main>
        </div>
      </div>
    </div>
  );
}
