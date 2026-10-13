import { FACTORS, STRATEGIES, type Strategy } from "./config";
import { applyOverrides, emphasiseStated } from "./weights";
import { tierForScore } from "./tier";
import type {
  BreakdownRow, Ctx, FactorName, MatchProfile, Preference, RankedCandidate,
} from "./types";

export function strategyFor(client: MatchProfile, preference: Preference | null): Strategy {
  const base = client.gender === "MALE" ? STRATEGIES.MALE_CLIENT : STRATEGIES.FEMALE_CLIENT;
  // Emphasis first, so an explicit matchmaker override still has the last word.
  const emphasised = emphasiseStated(base, preference);
  return applyOverrides(emphasised, preference?.weightOverrides);
}

export function scorePair(
  client: MatchProfile,
  candidate: MatchProfile,
  ctx: Ctx,
): { ruleScore: number; breakdown: BreakdownRow[] } {
  const strategy = strategyFor(client, ctx.preference);
  const breakdown: BreakdownRow[] = [];
  let weighted = 0;
  let totalWeight = 0;

  for (const [name, config] of Object.entries(strategy) as Array<[FactorName, { weight: number }]>) {
    if (config.weight <= 0) continue;
    const { score, reason } = FACTORS[name](client, candidate, ctx);
    const clamped = Math.max(0, Math.min(1, score));
    breakdown.push({ factor: name, weight: config.weight, score: clamped, reason });
    weighted += config.weight * clamped;
    totalWeight += config.weight;
  }

  const ruleScore = totalWeight === 0 ? 0 : Math.round((100 * weighted) / totalWeight);
  // Strongest contribution first, so the UI can show the top reasons.
  breakdown.sort((a, b) => b.weight * b.score - a.weight * a.score);
  return { ruleScore, breakdown };
}

export function rankCandidates(
  client: MatchProfile,
  candidates: MatchProfile[],
  ctx: Ctx,
): RankedCandidate[] {
  return candidates
    .map((candidate) => {
      const { ruleScore, breakdown } = scorePair(client, candidate, ctx);
      return { candidateId: candidate.id, ruleScore, breakdown };
    })
    .sort((a, b) => b.ruleScore - a.ruleScore || a.candidateId.localeCompare(b.candidateId));
}

export { tierForScore };
export { pairHash } from "./hash";
export type { MatchProfile, Preference, Ctx, RankedCandidate, BreakdownRow };
