import type { Factor } from "../types";

export const languageFactor: Factor = (client, candidate) => {
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
