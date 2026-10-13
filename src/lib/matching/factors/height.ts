import { decay, type Factor } from "../types";

/** Male client: candidate shorter, sweet spot 5-20cm. */
export const heightFactor: Factor = (client, candidate) => {
  const gap = client.heightCm - candidate.heightCm;

  if (client.gender === "MALE") {
    if (gap >= 5 && gap <= 20) return { score: 1, reason: `${gap} cm shorter` };
    if (gap > 20) return { score: decay(gap - 20, 15, 0.4), reason: `${gap} cm shorter` };
    if (gap >= 0) return { score: 0.6, reason: gap === 0 ? "Same height" : `${gap} cm shorter` };
    return { score: 0.15, reason: `${-gap} cm taller` };
  }

  // Female client: a taller partner is the common preference, but not a hard rule.
  const rise = candidate.heightCm - client.heightCm;
  if (rise >= 2 && rise <= 20) return { score: 1, reason: `${rise} cm taller` };
  if (rise > 20) return { score: decay(rise - 20, 15, 0.5), reason: `${rise} cm taller` };
  if (rise >= 0) return { score: 0.7, reason: rise === 0 ? "Same height" : `${rise} cm taller` };
  return { score: 0.3, reason: `${-rise} cm shorter` };
};
