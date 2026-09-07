import type { Metadata } from "next";
import ReservarClient from "./ReservarClient";

export const metadata: Metadata = {
  title: "Reservar clase",
  description: "Reserva tu clase de Pilates Reformer en Pink Pilates, Reñaca. Cupos limitados por sala.",
};

export default function Page() {
  return <ReservarClient />;
}
