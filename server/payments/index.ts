import { env } from "../env";
import { MockProvider } from "./mock.provider";
import type { PaymentProvider } from "./types";

const mock = new MockProvider();

/**
 * Ninguna ruta ni servicio importa un adaptador concreto: todos pasan por aquí.
 * Cambiar de pasarela es cambiar PAYMENTS_PROVIDER en el entorno.
 */
export function getPaymentProvider(id?: string): PaymentProvider {
  const chosen = id ?? env().PAYMENTS_PROVIDER;
  switch (chosen) {
    case "mock":
      return mock;
    case "mercadopago":
    case "flow":
    case "transbank":
      throw new Error(
        `La pasarela "${chosen}" aún no está implementada. Crear server/payments/${chosen}.provider.ts ` +
          `implementando PaymentProvider y registrarlo aquí.`,
      );
    default:
      return mock;
  }
}

export { mock as mockProvider };
export * from "./types";
