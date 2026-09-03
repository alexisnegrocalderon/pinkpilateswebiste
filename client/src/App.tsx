import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, Protegido } from "./lib/auth";
import "./panel.css";

import Home from "@/pages/Home";
import Acceso from "@/pages/Acceso";
import Reservar from "@/pages/Reservar";
import PlanesPublico from "@/pages/PlanesPublico";
import Checkout from "@/pages/Checkout";
import PagoMock from "@/pages/PagoMock";
import PagoResultado from "@/pages/PagoResultado";

import MiInicio from "@/pages/mi/Inicio";
import MisReservas from "@/pages/mi/Reservas";
import MiPlan from "@/pages/mi/Plan";
import MisCompras from "@/pages/mi/Compras";
import MiPerfil from "@/pages/mi/Perfil";

import Resumen from "@/pages/panel/Resumen";
import Agenda from "@/pages/panel/Agenda";
import Horarios from "@/pages/panel/Horarios";
import Alumnas from "@/pages/panel/Alumnas";
import AlumnaDetalle from "@/pages/panel/AlumnaDetalle";
import PanelPlanes from "@/pages/panel/Planes";
import Pagos from "@/pages/panel/Pagos";
import Emails from "@/pages/panel/Emails";
import Reportes from "@/pages/panel/Reportes";
import Config from "@/pages/panel/Config";
import Auditoria from "@/pages/panel/Auditoria";

/** Envuelve una pantalla del panel con el control de rol. */
const soloEstudio = (Componente: React.ComponentType) => () => (
  <Protegido roles={["owner", "instructor"]}>
    <Componente />
  </Protegido>
);

const soloAlumna = (Componente: React.ComponentType) => () => (
  <Protegido>
    <Componente />
  </Protegido>
);

function Router() {
  return (
    <Switch>
      {/* Público */}
      <Route path="/" component={Home} />
      <Route path="/reservar" component={Reservar} />
      <Route path="/planes" component={PlanesPublico} />
      <Route path="/ingresar">{() => <Acceso modo="entrar" />}</Route>
      <Route path="/crear-cuenta">{() => <Acceso modo="crear" />}</Route>
      <Route path="/checkout/:id" component={Checkout} />
      <Route path="/pagar/mock/:token" component={PagoMock} />
      <Route path="/pago/resultado" component={PagoResultado} />

      {/* Portal de la alumna */}
      <Route path="/mi" component={soloAlumna(MiInicio)} />
      <Route path="/mi/reservas" component={soloAlumna(MisReservas)} />
      <Route path="/mi/plan" component={soloAlumna(MiPlan)} />
      <Route path="/mi/compras" component={soloAlumna(MisCompras)} />
      <Route path="/mi/perfil" component={soloAlumna(MiPerfil)} />

      {/* Panel del estudio */}
      <Route path="/admin" component={soloEstudio(Resumen)} />
      <Route path="/admin/agenda" component={soloEstudio(Agenda)} />
      <Route path="/admin/horarios" component={soloEstudio(Horarios)} />
      <Route path="/admin/alumnas" component={soloEstudio(Alumnas)} />
      <Route path="/admin/alumnas/:id" component={soloEstudio(AlumnaDetalle)} />
      <Route path="/admin/planes" component={soloEstudio(PanelPlanes)} />
      <Route path="/admin/pagos" component={soloEstudio(Pagos)} />
      <Route path="/admin/emails" component={soloEstudio(Emails)} />
      <Route path="/admin/reportes" component={soloEstudio(Reportes)} />
      <Route path="/admin/config" component={soloEstudio(Config)} />
      <Route path="/admin/auditoria" component={soloEstudio(Auditoria)} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
