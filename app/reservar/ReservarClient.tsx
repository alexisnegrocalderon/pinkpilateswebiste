"use client";

import Reservar from "@/pages/Reservar";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function ReservarClient() {
  return (
    <>
      <SiteHeader />
      <Reservar />
      <SiteFooter />
    </>
  );
}
