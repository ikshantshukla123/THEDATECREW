import OpenAI from "openai";
import { env, isAiEnabled } from "@/lib/env";

/**
 * Returns null when AI is unconfigured — callers fall back to rule-based
 * output rather than throwing.
 */
export function getAiClient(): OpenAI | null {
  if (!isAiEnabled) return null;

  return new OpenAI({
    baseURL: env.AI_BASE_URL,
    apiKey: env.AI_API_KEY,
    // A 10-candidate rerank measured 20s on a free model; 15s times out.
    timeout: 60_000,
    maxRetries: 0,
    defaultHeaders: env.AI_BASE_URL.includes("openrouter.ai")
      ? { "HTTP-Referer": env.APP_URL, "X-Title": "Matchmaker Dashboard" }
      : undefined,
  });
}
