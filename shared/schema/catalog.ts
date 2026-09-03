import { boolean, integer, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { citext } from "./_types";
import { classLevel, discipline } from "./enums";

/**
 * Salas. La capacidad sale del equipamiento real del estudio:
 * "5 reformers, 4 Unit wall, Chair, Balones, Mat de 15mm."
 */
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    capacity: smallint("capacity").notNull(),
    description: text("description"),
    /** Preparado para multi-sede sin migración: hoy todas comparten dirección. */
    location: text("location"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_rooms_name").on(t.name)],
);

export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    code: text("code").notNull(),
    isOperational: boolean("is_operational").notNull().default(true),
    notes: text("notes"),
  },
  (t) => [uniqueIndex("uq_equipment_room_code").on(t.roomId, t.code)],
);

export const classTypes = pgTable(
  "class_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: citext("slug").notNull(),
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    discipline: discipline("discipline").notNull(),
    level: classLevel("level").notNull().default("all_levels"),
    defaultDurationMin: smallint("default_duration_min").notNull().default(60),
    defaultCapacity: smallint("default_capacity").notNull(),
    /** Precio de la clase suelta, en pesos enteros. */
    dropInPriceClp: integer("drop_in_price_clp").notNull(),
    color: text("color"),
    imageUrl: text("image_url"),
    isPublic: boolean("is_public").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: smallint("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_class_types_slug").on(t.slug)],
);
