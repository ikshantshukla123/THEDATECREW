import type { MatchProfile } from "@/lib/matching/types";
import { ageOf } from "@/lib/matching/types";

/**
 * Strips direct identifiers before anything leaves for the LLM: no names,
 * email, phone, exact date of birth, college or employer. Income goes as a
 * band, never an exact figure. The `ref` maps back server-side.
 *
 * Note this is "no direct identifiers", not anonymity — age plus city plus
 * profession is re-identifying in a small enough pool.
 */
export type SanitizedProfile = {
  ref: string;
  /** Needed for correct pronouns. Not a direct identifier. */
  gender: string;
  age: number;
  heightCm: number;
  city: string;
  relocate: string;
  education: string;
  profession: string;
  incomeBand: string;
  religion: string;
  motherTongue: string;
  familyValues: string;
  familyType: string;
  diet: string;
  smoking: string;
  drinking: string;
  wantKids: string;
  maritalStatus: string;
};

export function incomeBand(annual: number): string {
  const lakhs = annual / 100_000;
  if (lakhs < 5) return "under 5L";
  if (lakhs < 10) return "5-10L";
  if (lakhs < 15) return "10-15L";
  if (lakhs < 25) return "15-25L";
  if (lakhs < 40) return "25-40L";
  if (lakhs < 75) return "40-75L";
  return "75L+";
}

export function sanitize(profile: MatchProfile, ref: string, now: Date): SanitizedProfile {
  return {
    ref,
    gender: profile.gender,
    age: ageOf(profile, now),
    heightCm: profile.heightCm,
    city: profile.city,
    relocate: profile.openToRelocate,
    education: profile.highestEducation,
    profession: profile.designation ?? "Not specified",
    incomeBand: incomeBand(profile.annualIncome),
    religion: profile.religion,
    motherTongue: profile.motherTongue,
    familyValues: profile.familyValues,
    familyType: profile.familyType,
    diet: profile.diet,
    smoking: profile.smoking,
    drinking: profile.drinking,
    wantKids: profile.wantKids,
    maritalStatus: profile.maritalStatus,
  };
}
