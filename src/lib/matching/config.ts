import type { FactorName, Factor } from "./types";
import { ageFactor } from "./factors/age";
import { careerFactor } from "./factors/career";
import { educationFactor } from "./factors/education";
import { heightFactor } from "./factors/height";
import { incomeFactor } from "./factors/income";
import { kidsFactor } from "./factors/kids";
import { languageFactor } from "./factors/language";
import { lifestyleFactor } from "./factors/lifestyle";
import { locationFactor } from "./factors/location";
import { relocationFactor } from "./factors/relocation";
import { valuesFactor } from "./factors/values";

export const FACTORS: Record<FactorName, Factor> = {
  age: ageFactor,
  career: careerFactor,
  education: educationFactor,
  height: heightFactor,
  income: incomeFactor,
  kids: kidsFactor,
  language: languageFactor,
  lifestyle: lifestyleFactor,
  location: locationFactor,
  relocation: relocationFactor,
  values: valuesFactor,
};

export type Strategy = Partial<Record<FactorName, { weight: number }>>;

/**
 * The brief's male-client rules expressed as tunable weights rather than
 * hardcoded logic, so a per-client override can switch any of them off.
 * Each strategy sums to 100 — enforced by a test.
 */
export const STRATEGIES = {
  MALE_CLIENT: {
    age: { weight: 20 },
    kids: { weight: 18 },
    income: { weight: 14 },
    height: { weight: 12 },
    values: { weight: 10 },
    relocation: { weight: 10 },
    lifestyle: { weight: 8 },
    language: { weight: 4 },
    location: { weight: 4 },
  },
  FEMALE_CLIENT: {
    education: { weight: 15 },
    career: { weight: 15 },
    values: { weight: 15 },
    kids: { weight: 15 },
    relocation: { weight: 12 },
    lifestyle: { weight: 10 },
    age: { weight: 8 },
    language: { weight: 5 },
    location: { weight: 5 },
  },
} as const satisfies Record<string, Strategy>;

export type StrategyName = keyof typeof STRATEGIES;
