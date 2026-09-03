import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { CalendarDays, CreditCard, Home, LogOut, Ticket, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { iniciales } from "./base";

const NAV = [
  { href: "/mi", icono: Home, texto: "Inicio" },
  { href: "/mi/reservas", icono: CalendarDays, texto: "Mis clases" },
  { href: "/mi/plan", icono: Ticket, texto: "Mi plan" },
  { href: "/mi/compras", icono: CreditCard, texto: "Compras" },
  { href: "/mi/perfil", icono: User, texto: "Mi perfil" },
];

export default function StudentShell({ titulo, sub, acciones, children }: {
  titulo: string; sub?: string; acciones?: ReactNode; children: ReactNode;
}) {
  const [ruta] = useLocation();
  const { usuario, salir } = useAuth();

  return (
    <div className="pp-app">
      <div className="pp-shell">
        <aside className="pp-lateral">
          <div className="pp-marca">
            <div className="pp-marca-icono">P</div>
            <div className="pp-marca-texto">
              <b>Pink Pilates</b>
              <span>Mi cuenta</span>
            </div>
          </div>

          {NAV.map((it) => {
            const Icono = it.icono;
            const activo = it.href === "/mi" ? ruta === "/mi" : ruta.startsWith(it.href);
            return (
              <Link key={it.href} href={it.href} className="pp-nav-item" aria-current={activo ? "page" : undefined}>
                <Icono />
                {it.texto}
              </Link>
            );
          })}

          <div style={{ marginTop: 16 }}>
            <Link href="/reservar" className="pp-btn primario ancho">Reservar una clase</Link>
          </div>

          <div className="pp-lateral-pie">
            <div className="pp-usuario">
              <div className="pp-avatar">{iniciales(usuario?.firstName ?? "", usuario?.lastName ?? "")}</div>
              <div className="pp-usuario-datos">
                <b>{usuario?.firstName} {usuario?.lastName}</b>
                <span>{usuario?.email}</span>
              </div>
            </div>
            <button className="pp-nav-item" onClick={() => void salir()}><LogOut /> Cerrar sesión</button>
          </div>
        </aside>

        <div className="pp-principal">
          <header className="pp-cabecera">
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
