"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/lib/auth";
import type { ReactNode } from "react";

/**
 * Mismos providers que antes tenía App.tsx (Vite) — sólo se les quitó el
 * <Router> de wouter, que ahora lo pone cada segmento que lo necesita
 * (/admin, /mi) en vez de envolver todo el sitio: las páginas públicas no
 * necesitan wouter, las maneja el App Router de Next.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>{children}</AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
