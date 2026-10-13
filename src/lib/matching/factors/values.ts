import type { FamilyValues } from "@prisma/client";
import type { Factor } from "../types";

const ORDER: FamilyValues[] = ["TRADITIONAL", "MODERATE", "LIBERAL"];
const word = (v: FamilyValues) => v.toLowerCase();

export const valuesFactor: Factor = (client, candidate) => {
  const distance = Math.abs(
    ORDER.indexOf(client.familyValues) - ORDER.indexOf(candidate.familyValues),
  );
  const sameType = client.familyType === candidate.familyType;
  const typeBonus = sameType ? 0.1 : 0;

  if (distance === 0) {
    return {
      score: Math.min(1, 1 + typeBonus),
      reason: sameType
        ? `Both from ${word(client.familyValues)} ${client.familyType.toLowerCase()} families`
        : `Both from ${word(client.familyValues)} families`,
    };
  }
  if (distance === 1) {
    return {
      score: Math.min(1, 0.6 + typeBonus),
      reason: `${word(candidate.familyValues)} against ${word(client.familyValues)} upbringing`,
    };
  }
  return {
    score: 0.2,
    reason: `${word(candidate.familyValues)} and ${word(client.familyValues)} outlooks differ sharply`,
  };
};
