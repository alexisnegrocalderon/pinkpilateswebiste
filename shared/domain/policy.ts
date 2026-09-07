/**
 * El sitio ya no gestiona reservas ni pagos (Javiera usa CrossHero para eso),
 * así que lo único que queda en `settings` es la base de conocimiento del
 * negocio para el futuro agente de WhatsApp — ver /admin/conocimiento.
 */
export const DEFAULT_SETTINGS = {
  businessKnowledge: { infoGeneral: "", preguntasFrecuentes: [] as { pregunta: string; respuesta: string }[] },
} as const;

export type SettingsShape = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof SettingsShape;

export const STUDIO = {
  name: "Pink Pilates",
  tagline: "Pink, Unleashed",
  email: "info@pinkpilates.cl",
  phone: "+56999471471",
  instagram: "@pinkpilates",
  address: "Angamos 326, Reñaca / Viña del Mar",
} as const;

/**
 * PLACEHOLDER — falta el link real de reservas/app de CrossHero de Javiera.
 * Todos los CTA de "reservar"/"comprar" del sitio apuntan acá. Reemplazar en
 * cuanto lo tengamos; hasta entonces esta URL no lleva a ningún lado real.
 */
export const CROSSHERO_URL = "https://crosshero.com/PENDIENTE-link-de-pink-pilates";
