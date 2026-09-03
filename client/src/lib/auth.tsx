import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { api, ApiError } from "./api";

export type Usuario = {
  id: string;
  email: string;
  role: "owner" | "instructor" | "student";
  firstName: string;
  lastName: string;
};

type AuthValue = {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, password: string) => Promise<Usuario>;
  registrarse: (datos: Record<string, unknown>) => Promise<Usuario>;
  salir: () => Promise<void>;
  refrescar: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    try {
      setUsuario(await api.get<Usuario>("/auth/me"));
    } catch {
      // 401 es el caso normal de visitante sin sesión, no un error que mostrar.
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const value = useMemo<AuthValue>(
    () => ({
      usuario,
      cargando,
      refrescar,
      entrar: async (email, password) => {
        const u = await api.post<Usuario>("/auth/login", { email, password });
        setUsuario(u);
        return u;
      },
      registrarse: async (datos) => {
        const u = await api.post<Usuario>("/auth/register", datos);
        setUsuario(u);
        return u;
      },
      salir: async () => {
        await api.post("/auth/logout");
        setUsuario(null);
      },
    }),
    [usuario, cargando, refrescar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

/** Protege una rama del árbol. Redirige en vez de mostrar un error seco. */
export function Protegido({ roles, children }: { roles?: Usuario["role"][]; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const [, navegar] = useLocation();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) navegar("/ingresar");
    else if (roles && !roles.includes(usuario.role)) navegar("/mi");
  }, [usuario, cargando, roles, navegar]);

  if (cargando) return <div className="pp-cargando">Cargando…</div>;
  if (!usuario) return null;
  if (roles && !roles.includes(usuario.role)) return null;
  return <>{children}</>;
}

export { ApiError };
