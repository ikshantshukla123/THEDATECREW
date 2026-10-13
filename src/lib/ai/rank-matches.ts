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

/**
 * Free endpoints throttle per shared upstream pool, so a busy model must not
 * block ranking. Tried in order.
 */
function modelChain(): string[] {
  return [...new Set([env.AI_MODEL_REASONING, env.AI_MODEL_FAST].filter(Boolean) as string[])];
}

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

  const prompt = buildRankPrompt(input);
  let lastReason = "exhausted retries";

  for (const model of modelChain()) {
    const startedAt = Date.now();
    try {
      const response = await client.chat.completions.create({
        model,
        // ~550 output tokens per candidate on the reasoning model, plus its
        // own preamble. 4000 still truncated six candidates mid-string.
        max_tokens: 8000,
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
      }, {
        // Measured 38s for six candidates; the client default of 60s left
        // no room for the variance that was timing this out.
        timeout: 120_000,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) throw new Error("empty response");

      const parsed = RankResponseSchema.parse(JSON.parse(raw));

      // Models echo the ref inconsistently — "c1", " C1 ", "Candidate C1".
      // Normalise both sides rather than discarding a whole batch over
      // formatting. Unmatched refs are still dropped, never guessed:
      // attaching one candidate's reasons to another would be worse than
      // falling back to the rule-based text.
      const normalise = (ref: string) => ref.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const known = new Map(
        input.candidates.map((c) => [normalise(c.profile.ref), c.profile.ref]),
      );

      const matches = new Map<string, RankedMatch>();
      for (const match of parsed.matches) {
        const canonical = known.get(normalise(match.ref));
        if (canonical) matches.set(canonical, { ...match, ref: canonical });
      }

      logger.info("ai.rank", {
        model,
        durationMs: Date.now() - startedAt,
        candidates: input.candidates.length,
        annotated: matches.size,
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      });

      if (matches.size === 0) throw new Error("no usable candidates in response");
      return { source: "ai", model, matches };
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
      logger.warn("ai.rank.failed", { model, durationMs: Date.now() - startedAt, message: lastReason });
    }
  }

  return { source: "fallback", reason: lastReason };
}
