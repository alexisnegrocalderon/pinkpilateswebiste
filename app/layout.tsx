import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import { STUDIO } from "@shared/domain/policy";
import { Providers } from "./providers";
import "@/index.css";
// Tema del panel /admin y /mi. Todo queda bajo la clase .pp-app, así que
// cargarlo acá (Next.js trata cualquier CSS global como global de verdad,
// no importa desde qué ruta se importe) no afecta al resto del sitio.
import "@/panel.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

// Titulares bold/condensados en mayúscula — el tono "editorial fitness"
// que pidió Javiera (flyer Energy Jump + referencias tipo DP).
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const siteUrl = "https://pinkpilates.cl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${STUDIO.name} — Pilates Reformer en Reñaca`, template: `%s — ${STUDIO.name}` },
  description:
    "Estudio boutique de Pilates Reformer en Reñaca, Viña del Mar. Clases reducidas, 5 reformers, planes por créditos.",
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: STUDIO.name,
    title: `${STUDIO.name} — Pilates Reformer en Reñaca`,
    description: "Estudio boutique de Pilates Reformer en Reñaca, Viña del Mar.",
  },
  icons: { icon: "/favicon-heart.png", apple: "/favicon-heart.png" },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "ExerciseGym",
  name: STUDIO.name,
  description: "Estudio boutique de Pilates Reformer en Reñaca, Viña del Mar.",
  telephone: STUDIO.phone,
  email: STUDIO.email,
  url: siteUrl,
  sameAs: [`https://instagram.com/${STUDIO.instagram.replace("@", "")}`],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Angamos 326",
    addressLocality: "Reñaca, Viña del Mar",
    addressCountry: "CL",
  },
  priceRange: "$$",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${anton.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-archivo), system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
