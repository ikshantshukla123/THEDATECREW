import type { EducationLevel } from "@prisma/client";
import type { Factor } from "../types";

const RANK: Record<EducationLevel, number> = {
  DIPLOMA: 0, BACHELORS: 1, MASTERS: 2, DOCTORATE: 3,
};
const LABEL: Record<EducationLevel, string> = {
  DIPLOMA: "a diploma", BACHELORS: "a bachelor's", MASTERS: "a master's", DOCTORATE: "a doctorate",
};

/** Female client: candidate at or above her level. */
export const educationFactor: Factor = (client, candidate) => {
  const gap = RANK[candidate.highestEducation] - RANK[client.highestEducation];

  if (gap === 0) {
    return { score: 1, reason: `Both hold ${LABEL[client.highestEducation]}` };
  }
  if (gap > 0) {
    return { score: 1, reason: `Holds ${LABEL[candidate.highestEducation]}` };
  }
  if (gap === -1) {
    return { score: 0.5, reason: `Holds ${LABEL[candidate.highestEducation]}, one level below` };
  }
  return { score: 0.2, reason: `Holds ${LABEL[candidate.highestEducation]}` };
};
