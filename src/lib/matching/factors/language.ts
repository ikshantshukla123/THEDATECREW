import type { Factor } from "../types";

/**
 * A stated mother-tongue list wins over the client's own — families often
 * ask for a specific community regardless of what is spoken at home.
 */
export const languageFactor: Factor = (client, candidate, ctx) => {
  const wanted = ctx.preference?.motherTongues ?? [];

  if (wanted.length > 0) {
    if (wanted.includes(candidate.motherTongue)) {
      return { score: 1, reason: `${candidate.motherTongue}-speaking, as asked` };
    }
    const shared = client.languages.filter((l) => candidate.languages.includes(l));
    if (shared.length > 0) {
      return {
        score: 0.45,
        reason: `${candidate.motherTongue} household, but both speak ${shared[0]}`,
      };
    }
    return { score: 0.15, reason: `${candidate.motherTongue}, not a language they asked for` };
  }

  if (client.motherTongue === candidate.motherTongue) {
    return { score: 1, reason: `Both speak ${client.motherTongue} at home` };
  }
  const shared = client.languages.filter((l) => candidate.languages.includes(l));
  if (shared.length > 0) {
    return { score: 0.6, reason: `Different mother tongues, both speak ${shared[0]}` };
  }
  return {
    score: 0.25,
    reason: `${candidate.motherTongue} and ${client.motherTongue} households`,
  };
};
