import { inArray } from "drizzle-orm";
import { DEFAULT_SETTINGS, type SettingKey, type SettingsShape } from "@shared/domain/policy";
import { db } from "../db/client";
import { settings } from "@shared/schema";

/**
 * Las políticas se leen de la BD con fallback a los defaults. No se cachean en
 * memoria de proceso: en serverless cada invocación es un proceso nuevo y una
 * caché sólo produciría comportamiento inconsistente entre lambdas.
 */
export async function getSettings(): Promise<SettingsShape> {
  const rows = await db.select().from(settings);
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const row of rows) {
    if (row.key in DEFAULT_SETTINGS) out[row.key] = row.value;
  }
  return out as SettingsShape;
}

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingsShape[K]> {
  const rows = await db.select().from(settings).where(inArray(settings.key, [key]));
  return (rows[0]?.value as SettingsShape[K]) ?? DEFAULT_SETTINGS[key];
}
