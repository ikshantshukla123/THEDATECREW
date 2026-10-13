import { decay, type Factor } from "../types";

const L = (n: number) => `₹${Math.round(n / 100_000)}L`;

/**
 * Female client: income stability rather than a ceiling. Meeting her stated
 * floor matters; earning far less than her is the risk, not earning more.
 */
export const careerFactor: Factor = (client, candidate, ctx) => {
  const floor = ctx.preference?.minIncome ?? null;

  if (floor !== null && candidate.annualIncome < floor) {
    return {
      score: decay(1 - candidate.annualIncome / floor, 1, 0.1),
      reason: `Earns ${L(candidate.annualIncome)}, below her stated minimum`,
    };
  }

  const ratio = candidate.annualIncome / Math.max(1, client.annualIncome);
  if (ratio >= 0.9) {
    return {
      score: 1,
      reason: `${candidate.designation ?? "Established"} earning ${L(candidate.annualIncome)}`,
    };
  }
  return {
    score: decay(0.9 - ratio, 0.9, 0.3),
    reason: `Earns ${L(candidate.annualIncome)} against her ${L(client.annualIncome)}`,
  };
};
