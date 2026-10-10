import { z } from "zod";

export const createKbSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(64, "Name must not exceed 64 characters")
    .trim(),
  description: z
    .string()
    .max(256, "Description must not exceed 256 characters")
    .optional()
    .nullable(),
  prompt: z
    .string()
    .min(10, "System prompt must be at least 10 characters")
    .max(2000, "System prompt must not exceed 2000 characters")
    .optional(),
  colorCode: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color code")
    .optional()
    .default("#06b6d4"),
  isPublic: z.boolean().optional().default(true),
});

export const updateKbSchema = createKbSchema.partial();

export type CreateKbInput = z.infer<typeof createKbSchema>;
export type UpdateKbInput = z.infer<typeof updateKbSchema>;
