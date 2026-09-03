import { z } from "zod";

/** Teléfono chileno en formato +569XXXXXXXX, tolerante a espacios y guiones. */
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^\+?56\d{9}$/.test(v) || /^9\d{8}$/.test(v), "Teléfono chileno inválido")
  .transform((v) => (v.startsWith("+") ? v : v.startsWith("56") ? `+${v}` : `+56${v}`));

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z.string().trim().min(2, "Ingresa tu nombre"),
  lastName: z.string().trim().min(2, "Ingresa tu apellido"),
  phone: phone.optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: phone.optional(),
  healthNotes: z.string().trim().max(2000).optional(),
  marketingOptIn: z.boolean().default(true),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  phone: phone.optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: phone.optional(),
  healthNotes: z.string().trim().max(2000).optional(),
  goals: z.string().trim().max(1000).optional(),
  marketingOptIn: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
