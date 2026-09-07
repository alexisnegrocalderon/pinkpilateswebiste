import type { Metadata } from "next";
import { ContactoClient } from "./ContactoClient";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos con tus dudas sobre planes y clases de Pink Pilates en Reñaca.",
};

export default function ContactoPage() {
  return <ContactoClient />;
}
