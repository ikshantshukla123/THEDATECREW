import type { MatchTier } from "@prisma/client";

/**
 * Rule-based tier, used directly when the LLM is unavailable.
 *
 * Thresholds are calibrated for a POST-FILTER pool. Candidates reaching this
 * point already cleared age, height, religion, caste, marital status and the
 * children dealbreaker, so their scores cluster high — an 80 cutoff tiered
 * every single survivor as High Potential, which tells a matchmaker nothing.
 */
export function tierForScore(score: number): MatchTier {
  if (score >= 88) return "HIGH_POTENTIAL";
  if (score >= 76) return "GOOD";
  if (score >= 62) return "WORTH_EXPLORING";
  return "LOW";
}

const ORDER: MatchTier[] = ["HIGH_POTENTIAL", "GOOD", "WORTH_EXPLORING", "LOW"];

/**
 * The model may nudge a tier, not contradict the score.
 *
 * It downgraded a 93 to LOW while leaving an 86 at WORTH_EXPLORING, so the
 * list showed a higher-scoring candidate ranked below a lower-scoring one.
 * Its stated reason was that the candidate would not relocate — true, but
 * the client had already said she would, which the engine had scored
 * correctly.
 *
 * Nuance the number cannot capture is worth one band in either direction.
 * More than that means the label and the score are telling different
 * stories, and the score is the one with a tested derivation.
 */
export function clampTier(suggested: MatchTier, ruleScore: number): MatchTier {
  const base = ORDER.indexOf(tierForScore(ruleScore));
  const want = ORDER.indexOf(suggested);
  const bounded = Math.max(base - 1, Math.min(base + 1, want));
  return ORDER[bounded];
}
