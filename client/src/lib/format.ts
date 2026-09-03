/** Formatos chilenos. El peso no tiene decimales: nunca mostrar centavos. */
export const clp = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export const numero = (n: number) => new Intl.NumberFormat("es-CL").format(n);

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-09-10" -> Date en mediodía UTC, para que el día no se corra por zona. */
const parseDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

export const diaSemana = (iso: string) => DIAS[parseDate(iso).getUTCDay()];
export const diaCorto = (iso: string) => DIAS_CORTOS[parseDate(iso).getUTCDay()];
export const diaNumero = (iso: string) => parseDate(iso).getUTCDate();

/** "10 de septiembre" */
export const fechaLarga = (iso: string) => {
  const d = parseDate(iso);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
};

/** "mié 10 sep" */
export const fechaCorta = (iso: string) => {
  const d = parseDate(iso);
  return `${DIAS_CORTOS[d.getUTCDay()].toLowerCase()} ${d.getUTCDate()} ${MESES[d.getUTCMonth()].slice(0, 3)}`;
};

/** "2026-09" -> "sep 2026" */
export const mesCorto = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES[m - 1].slice(0, 3)} ${y}`;
};

export const hora = (t: string) => t.slice(0, 5);

/** "hoy", "mañana" o la fecha, para que la alumna ubique la clase de un vistazo. */
export function fechaRelativa(iso: string, hoyIso: string) {
  const dias = Math.round((parseDate(iso).getTime() - parseDate(hoyIso).getTime()) / 86_400_000);
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  if (dias === -1) return "ayer";
  return fechaCorta(iso);
}

export const hoyEnSantiago = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());

/** Etiquetas legibles: la dueña no debe ver jerga técnica en pantalla. */
export const ESTADO_RESERVA: Record<string, string> = {
  booked: "Reservada",
  attended: "Asistió",
  no_show: "No llegó",
  cancelled: "Cancelada",
  late_cancelled: "Cancelación tardía",
  studio_cancelled: "Cancelada por el estudio",
};

export const ESTADO_MEMBRESIA: Record<string, string> = {
  active: "Activo",
  pending_verification: "Por verificar",
  expired: "Vencido",
  depleted: "Sin créditos",
  cancelled: "Cancelado",
};

export const ESTADO_ORDEN: Record<string, string> = {
  draft: "Borrador",
  awaiting_payment: "Esperando pago",
  paid: "Pagada",
  failed: "Fallida",
  expired: "Vencida",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
};

export const MOTIVO_CREDITO: Record<string, string> = {
  purchase: "Compra de plan",
  booking: "Reserva de clase",
  cancellation_refund: "Devolución por cancelación",
  late_cancel_forfeit: "Cancelación tardía (crédito perdido)",
  no_show_forfeit: "No llegó (crédito perdido)",
  studio_cancel_refund: "El estudio canceló (devuelto)",
  admin_adjust: "Ajuste manual",
  expiration: "Créditos vencidos",
};

export const SEGMENTO: Record<string, string> = {
  adult: "Adultos",
  student: "Estudiantes",
  valle: "Valle",
  special: "Especiales",
};
