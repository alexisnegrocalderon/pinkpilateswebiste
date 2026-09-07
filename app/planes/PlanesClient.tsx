"use client";

import PlanesPublico from "@/pages/PlanesPublico";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export default function PlanesClient() {
  return (
    <>
      <SiteHeader />
      <PlanesPublico />
      <SiteFooter />
    </>
  );
}
