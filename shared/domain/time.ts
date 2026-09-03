import { TZDate } from "@date-fns/tz";

/**
 * Toda fecha de negocio vive en esta zona. Las lambdas de Vercel corren en UTC
 * y la máquina de desarrollo en cualquier cosa: calcular "hoy" con la zona del
 * proceso da el día equivocado entre las 21:00 y las 00:00 en Chile.
 *
 * Regla dura del proyecto: ninguna fecha de negocio se calcula con la zona
 * horaria del proceso. En SQL, "hoy" es siempre
 * `(now() AT TIME ZONE 'America/Santiago')::date`.
 */
export const STUDIO_TZ = "America/Santiago";

/** "2026-09-03" en hora de Santiago, sea cual sea la zona del proceso. */
export function todayInSantiago(now: Date = new Date()): string {
  return formatSantiagoDate(now);
}

export function formatSantiagoDate(instant: Date): string {
  const d = new TZDate(instant, STUDIO_TZ);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Convierte fecha local + hora de pared al instante real, respetando el cambio
 * de hora de Chile. Nunca usar un offset fijo: el horario de verano lo rompe.
 */
export function santiagoInstant(localDate: string, startTime: string): Date {
  const [y, m, d] = localDate.split("-").map(Number);
  const [hh, mm] = startTime.split(":").map(Number);
  return new TZDate(y, m - 1, d, hh, mm, 0, STUDIO_TZ).withTimeZone("UTC");
}

/** 0 = domingo .. 6 = sábado, en hora local de Santiago. */
export function weekdayInSantiago(localDate: string): number {
  const [y, m, d] = localDate.split("-").map(Number);
  return new TZDate(y, m - 1, d, 12, 0, 0, STUDIO_TZ).getDay();
}

export function addDaysToDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export const weekdayName = (w: number) => DIAS[w] ?? "";
export const weekdayShort = (w: number) => DIAS_CORTOS[w] ?? "";

/** "19:00:00" -> "19:00" */
export const hhmm = (t: string) => t.slice(0, 5);
