import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { BreakdownRow } from "@/lib/matching/types";
import { getAiClient } from "./client";
import { buildRankPrompt, RANK_SYSTEM } from "./prompts";
import { RANK_JSON_SCHEMA, RankResponseSchema, type RankedMatch } from "./schemas";
import type { SanitizedProfile } from "./sanitize";

export type RankInput = {
  client: SanitizedProfile;
  candidates: Array<{ profile: SanitizedProfile; ruleScore: number; breakdown: BreakdownRow[] }>;
};

export type RankOutcome =
  | { source: "ai"; model: string; matches: Map<string, RankedMatch> }
  | { source: "fallback"; reason: string };

/**
 * One batched call for the whole shortlist. Validated, retried once, and
 * degraded to rule-based output rather than ever throwing into the page.
 */
export async function rankWithAi(input: RankInput): Promise<RankOutcome> {
  const client = getAiClient();
  if (!client) return { source: "fallback", reason: "AI is not configured" };

  const model = env.AI_MODEL_REASONING!;
  const prompt = buildRankPrompt(input);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const startedAt = Date.now();
    try {
      const response = await client.chat.completions.create({
        model,
        // Strict schema where the provider supports it; the zod layer below
        // covers the models that ignore it.
        response_format: {
          type: "json_schema",
          json_schema: { name: "ranked_matches", strict: true, schema: RANK_JSON_SCHEMA },
        },
        messages: [
          { role: "system", content: RANK_SYSTEM },
          { role: "user", content: prompt },
        ],
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error("empty response");

      const parsed = RankResponseSchema.parse(JSON.parse(raw));
      const known = new Set(input.candidates.map((c) => c.profile.ref));

      // Unknown refs are dropped; missing ones fall back per candidate.
      const matches = new Map<string, RankedMatch>();
      for (const match of parsed.matches) {
        if (known.has(match.ref)) matches.set(match.ref, match);
      }

      logger.info("ai.rank", {
        model,
        attempt,
        durationMs: Date.now() - startedAt,
        candidates: input.candidates.length,
        annotated: matches.size,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      });

      if (matches.size === 0) throw new Error("no usable candidates in response");
      return { source: "ai", model, matches };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn("ai.rank.failed", { model, attempt, durationMs: Date.now() - startedAt, message });
      if (attempt === 2) return { source: "fallback", reason: message };
    }
  }

  return { source: "fallback", reason: "exhausted retries" };
}
