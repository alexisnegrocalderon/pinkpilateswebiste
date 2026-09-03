/** Formato de moneda chilena. CLP no tiene decimales: todo entero, siempre. */
export function formatClp(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Redondeo a peso entero, hacia arriba, para prorrateos y descuentos. */
export const toClp = (n: number) => Math.max(0, Math.round(n));

/**
 * Prorrateo: el sitio del estudio indica "cálculo proporcional para ingresos en
 * fechas intermedias". Se cobra la fracción del período que la alumna alcanza a
 * usar, con un piso de un crédito.
 */
export function prorate(fullPriceClp: number, totalDays: number, remainingDays: number) {
  if (remainingDays >= totalDays) return fullPriceClp;
  const ratio = Math.max(0, remainingDays) / totalDays;
  return toClp(fullPriceClp * ratio);
}
