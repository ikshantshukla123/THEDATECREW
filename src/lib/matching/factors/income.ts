import { decay, type Factor } from "../types";

const L = (n: number) => `₹${Math.round(n / 100_000)}L`;

/** Male client: candidate earning at or below him scores full. */
export const incomeFactor: Factor = (client, candidate) => {
  if (candidate.annualIncome <= client.annualIncome) {
    return { score: 1, reason: `Earns ${L(candidate.annualIncome)}, within his range` };
  }
  const excess = candidate.annualIncome / client.annualIncome - 1;
  return {
    score: decay(excess, 1.5, 0.3),
    reason: `Earns ${L(candidate.annualIncome)} against ${L(client.annualIncome)}`,
  };
};
