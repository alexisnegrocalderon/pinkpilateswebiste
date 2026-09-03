/** Valores por defecto de las políticas del estudio; editables en /panel/config. */
export const DEFAULT_SETTINGS = {
  /** Horas antes del inicio bajo las cuales cancelar cuesta el crédito. */
  late_cancel_hours: 12,
  /** Con cuántos días de anticipación se abre la reserva. */
  booking_opens_days_ahead: 30,
  /** Minutos antes del inicio en que se cierra la reserva. */
  booking_closes_minutes_before: 60,
  /** Cuánto dura una oferta de lista de espera sin auto-reserva. */
  waitlist_offer_minutes: 120,
  /** El no-show consume el crédito. */
  no_show_forfeits_credit: true,
  /** Cuántos días hacia adelante se materializan clases. */
  booking_horizon_days: 60,
  /** Minutos que se sostiene el cupo mientras se paga una clase suelta. */
  order_hold_minutes: 30,
} as const;

export type SettingsShape = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof SettingsShape;

export const STUDIO = {
  name: "Pink Pilates",
  tagline: "Pink, Unleashed",
  email: "contacto@pinkpilates.cl",
  phone: "+56999471471",
  instagram: "@pinkpilates",
  address: "Angamos 326, Reñaca / Viña del Mar",
} as const;
