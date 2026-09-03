import { createHash, randomBytes, timingSafeEqual, createHmac } from "crypto";

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export const hmac = (secret: string, payload: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

/** Comparación en tiempo constante: evita filtrar la firma por temporización. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Token firmado y con vencimiento, para el pagador simulado. */
export function signPayload(secret: string, data: Record<string, unknown>, ttlSeconds: number) {
  const body = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlSeconds * 1000 })).toString("base64url");
  return `${body}.${hmac(secret, body)}`;
}

export function verifyPayload<T = Record<string, unknown>>(secret: string, token: string): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (!safeEqual(sig, hmac(secret, body))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
