import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, Mail, Menu, Tag, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { iniciales } from "./base";

/**
 * El sitio pasó a ser 100% marketing/SEO — las reservas y pagos los
 * gestiona Javiera desde CrossHero. Lo único que queda por editar acá es
 * contenido: precios que se muestran, descripciones de clase, los
 * contactos que llegan por el formulario, y la base de conocimiento para
 * el futuro agente de WhatsApp.
 */
const NAV = [
  { href: "/admin/planes", icono: Tag, texto: "Planes y precios" },
  { href: "/admin/clases", icono: Users, texto: "Clases" },
  { href: "/admin/contactos", icono: Mail, texto: "Contactos" },
  { href: "/admin/conocimiento", icono: BookOpen, texto: "Base de conocimiento" },
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
            <img className="pp-marca-icono" src="/assets/pink/pink-pilates-isotipo.png" alt="Pink Pilates" />
            <div className="pp-marca-texto">
              <b>Pink Pilates</b>
              <span>Panel</span>
            </div>
          </div>

          {NAV.map((it) => {
            const Icono = it.icono;
            const activo = ruta.startsWith(it.href);
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
