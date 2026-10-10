import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(16, "AUTH_SECRET must be at least 16 characters")
    .default("synapse_rag_super_secret_jwt_key_at_least_32_chars_long"),
  NEXTAUTH_URL: z.string().optional(),
  AVAL_AI_API_KEY: z.string().optional(),
  AVAL_AI_BASE_URL: z.string().default("https://api.avalai.ir/v1"),
  AVAL_AI_MODEL: z.string().default("gpt-4o-mini"),
  AVAL_AI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
});

export const getEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn("Environment validation notice:", result.error.flatten().fieldErrors);
    return process.env;
  }
  return result.data;
};

export const env = getEnv();
