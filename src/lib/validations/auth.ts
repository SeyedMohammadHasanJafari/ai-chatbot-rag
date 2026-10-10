import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64).optional(),
  email: z.string().email("Invalid email address").max(128).trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
