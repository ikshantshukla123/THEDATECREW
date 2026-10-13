import type {
  Diet, EducationLevel, FamilyType, FamilyValues, Gender,
  Habit, Manglik, MaritalStatus, YesNoMaybe,
} from "@prisma/client";

/** The subset of a profile the engine scores on. No names, no contact. */
export type MatchProfile = {
  id: string;
  gender: Gender;
  dateOfBirth: Date;
  heightCm: number;
  city: string;
  state: string | null;
  annualIncome: number;
  highestEducation: EducationLevel;
  designation: string | null;
  maritalStatus: MaritalStatus;
  motherTongue: string;
  languages: string[];
  religion: string;
  caste: string | null;
  manglik: Manglik;
  familyType: FamilyType;
  familyValues: FamilyValues;
  diet: Diet;
  smoking: Habit;
  drinking: Habit;
  wantKids: YesNoMaybe;
  openToRelocate: YesNoMaybe;
};

export type Preference = {
  minAge: number | null;
  maxAge: number | null;
  minHeightCm: number | null;
  maxHeightCm: number | null;
  minIncome: number | null;
  religions: string[];
  castes: string[];
  casteNoBar: boolean;
  motherTongues: string[];
  cities: string[];
  diets: Diet[];
  acceptDivorced: boolean;
  manglikMatters: boolean;
  weightOverrides: unknown;
};

/** `now` is passed in so the engine stays pure and testable. */
export type Ctx = { now: Date; preference: Preference | null };

export type FactorResult = { score: number; reason: string };

export type Factor = (
  client: MatchProfile,
  candidate: MatchProfile,
  ctx: Ctx,
) => FactorResult;

export type FactorName =
  | "age" | "height" | "income" | "career" | "education" | "kids"
  | "relocation" | "values" | "lifestyle" | "language" | "location";

export type BreakdownRow = {
  factor: FactorName;
  weight: number;
  score: number;
  reason: string;
};

export type RankedCandidate = {
  candidateId: string;
  ruleScore: number;
  breakdown: BreakdownRow[];
};

export const MS_PER_YEAR = 31_557_600_000;

export function ageOf(profile: MatchProfile, now: Date): number {
  return Math.floor((now.getTime() - profile.dateOfBirth.getTime()) / MS_PER_YEAR);
}

/** Linear falloff from a sweet spot, clamped to [floor, 1]. */
export function decay(distance: number, tolerance: number, floor = 0): number {
  if (distance <= 0) return 1;
  return Math.max(floor, 1 - distance / tolerance);
}
