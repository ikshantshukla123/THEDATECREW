import { ageOf, decay, type Factor } from "../types";

const YEARS = (n: number) => `${n} ${n === 1 ? "year" : "years"}`;

/**
 * For a male client the brief wants a younger candidate, sweet spot 1-5
 * years. For a female client the engine only cares that the gap is small.
 */
export const ageFactor: Factor = (client, candidate, ctx) => {
  const clientAge = ageOf(client, ctx.now);
  const candidateAge = ageOf(candidate, ctx.now);
  const gap = clientAge - candidateAge;

  if (client.gender === "MALE") {
    if (gap >= 1 && gap <= 5) {
      return { score: 1, reason: `${YEARS(gap)} younger` };
    }
    if (gap > 5) {
      return { score: decay(gap - 5, 8, 0.25), reason: `${YEARS(gap)} younger` };
    }
    if (gap === 0) return { score: 0.6, reason: "Same age" };
    return { score: 0.2, reason: `${YEARS(-gap)} older` };
  }

  const absolute = Math.abs(gap);
  if (absolute <= 4) {
    return {
      score: 1,
      reason: absolute === 0 ? "Same age" : `${YEARS(absolute)} ${gap > 0 ? "younger" : "older"}`,
    };
  }
  return {
    score: decay(absolute - 4, 8, 0.2),
    reason: `${YEARS(absolute)} ${gap > 0 ? "younger" : "older"}`,
  };
};
