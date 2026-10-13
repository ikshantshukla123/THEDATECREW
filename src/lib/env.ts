import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),

  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters (openssl rand -base64 32)"),

  // Any OpenAI-compatible endpoint. Optional: without a key the matching
  // engine falls back to rule-based tiers.
  AI_BASE_URL: z.url().default("https://openrouter.ai/api/v1"),
  AI_API_KEY: z.string().optional(),
  AI_MODEL_REASONING: z.string().optional(),
  AI_MODEL_FAST: z.string().optional(),

  APP_URL: z.url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;

export const isAiEnabled = Boolean(
  env.AI_API_KEY && env.AI_MODEL_REASONING && env.AI_MODEL_FAST,
);
