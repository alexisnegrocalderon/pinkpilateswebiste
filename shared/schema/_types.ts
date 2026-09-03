import { customType } from "drizzle-orm/pg-core";

/**
 * `citext` — texto insensible a mayúsculas. Se usa para emails, slugs y códigos
 * de cupón, donde "Javiera@Mail.cl" y "javiera@mail.cl" deben colisionar en el
 * índice único. Requiere `CREATE EXTENSION citext`.
 */
export const citext = customType<{ data: string; driverData: string }>({
  dataType: () => "citext",
});
