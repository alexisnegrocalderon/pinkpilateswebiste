import type { Metadata } from "next";
import PlanesClient from "./PlanesClient";

export const metadata: Metadata = {
  title: "Planes y precios",
  description: "Planes de Pilates Reformer por créditos en Pink Pilates, Reñaca: mensual, trimestral, semestral y anual.",
};

export default function Page() {
  return <PlanesClient />;
}
