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
