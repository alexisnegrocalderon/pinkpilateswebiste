"use client";

import { Redirect, Route, Switch } from "wouter";
import { Protegido } from "@/lib/auth";
import NotFound from "@/pages/NotFound";

import PanelPlanes from "@/pages/panel/Planes";
import Clases from "@/pages/panel/Clases";
import Leads from "@/pages/panel/Leads";
import Conocimiento from "@/pages/panel/Conocimiento";

/**
 * El sitio pasó a ser 100% marketing/SEO — Javiera gestiona reservas,
 * clases y pagos desde CrossHero. Lo que queda acá es sólo contenido:
 * precios que se muestran, descripciones de clase, contactos y la base de
 * conocimiento para el futuro agente de WhatsApp. Se sigue rutando con
 * wouter puertas adentro, igual que el resto del panel portado.
 */
const soloEstudio = (Componente: React.ComponentType) => () => (
  <Protegido roles={["owner"]}>
    <Componente />
  </Protegido>
);

function AdminCatchAll() {
  return (
    <Switch>
      <Route path="/admin">
        <Redirect to="/admin/planes" />
      </Route>
      <Route path="/admin/planes" component={soloEstudio(PanelPlanes)} />
      <Route path="/admin/clases" component={soloEstudio(Clases)} />
      <Route path="/admin/contactos" component={soloEstudio(Leads)} />
      <Route path="/admin/conocimiento" component={soloEstudio(Conocimiento)} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default AdminCatchAll;
