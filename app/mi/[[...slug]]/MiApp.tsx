"use client";

import { Route, Switch } from "wouter";
import { Protegido } from "@/lib/auth";
import NotFound from "@/pages/NotFound";

import MiInicio from "@/pages/mi/Inicio";
import MisReservas from "@/pages/mi/Reservas";
import MiPlan from "@/pages/mi/Plan";
import MisCompras from "@/pages/mi/Compras";
import MiPerfil from "@/pages/mi/Perfil";

const soloAlumna = (Componente: React.ComponentType) => () => (
  <Protegido>
    <Componente />
  </Protegido>
);

function MiCatchAll() {
  return (
    <Switch>
      <Route path="/mi" component={soloAlumna(MiInicio)} />
      <Route path="/mi/reservas" component={soloAlumna(MisReservas)} />
      <Route path="/mi/plan" component={soloAlumna(MiPlan)} />
      <Route path="/mi/compras" component={soloAlumna(MisCompras)} />
      <Route path="/mi/perfil" component={soloAlumna(MiPerfil)} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default MiCatchAll;
