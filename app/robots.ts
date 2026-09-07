import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/mi", "/checkout", "/pagar", "/pago", "/ingresar", "/crear-cuenta"],
      },
    ],
    sitemap: "https://pinkpilates.cl/sitemap.xml",
  };
}
