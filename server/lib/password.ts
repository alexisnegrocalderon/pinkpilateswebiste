import bcrypt from "bcryptjs";

/**
 * Cost 10, no 12: bcryptjs es JS puro y en los 0.25 vCPU del free tier de Neon
 * un cost 12 agrega ~400 ms al login en frío.
 */
const COST = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
