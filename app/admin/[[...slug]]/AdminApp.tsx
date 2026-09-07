"use client";

import { Route, Switch } from "wouter";
import { Protegido } from "@/lib/auth";
import NotFound from "@/pages/NotFound";

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

/**
 * El panel entero (11 pantallas) se porta sin tocarlo: sigue siendo una app
 * client-side ruteada por wouter, igual que en el Vite/App.tsx original —
 * sólo cambió quién decide que "/admin/*" cae acá (antes wouter mismo,
 * ahora el App Router de Next). No necesita SEO ni SSR.
 */
const soloEstudio = (Componente: React.ComponentType) => () => (
  <Protegido roles={["owner", "instructor"]}>
    <Componente />
  </Protegido>
);

function AdminCatchAll() {
  return (
    <Switch>
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
      <Route component={NotFound} />
    </Switch>
  );
}

export default AdminCatchAll;
