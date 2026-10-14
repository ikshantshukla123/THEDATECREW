import type { MatchProfile, Preference } from "@/lib/matching/types";

export const NOW = new Date("2026-01-01T00:00:00Z");

export function yearsAgo(years: number): Date {
  return new Date(NOW.getTime() - years * 31_557_600_000);
}

export function profile(over: Partial<MatchProfile> = {}): MatchProfile {
  return {
    id: "p1",
    gender: "MALE",
    dateOfBirth: yearsAgo(30),
    heightCm: 175,
    city: "Pune",
    state: "Maharashtra",
    annualIncome: 2_000_000,
    highestEducation: "MASTERS",
    designation: "Product Manager",
    maritalStatus: "NEVER_MARRIED",
    motherTongue: "Marathi",
    languages: ["Marathi", "Hindi", "English"],
    religion: "Hindu",
    caste: "Deshastha Brahmin",
    gotra: "Bharadwaj",
    manglik: "NO",
    familyType: "NUCLEAR",
    familyValues: "MODERATE",
    diet: "VEG",
    smoking: "NO",
    drinking: "NO",
    wantKids: "YES",
    openToRelocate: "MAYBE",
    ...over,
  };
}

export function preference(over: Partial<Preference> = {}): Preference {
  return {
    minAge: null, maxAge: null, minHeightCm: null, maxHeightCm: null,
    minIncome: null, religions: [], castes: [], casteNoBar: true,
    motherTongues: [], cities: [], diets: [], acceptDivorced: false,
    manglikMatters: false, weightOverrides: null,
    ...over,
  };
}

export const ctx = (pref: Preference | null = null) => ({ now: NOW, preference: pref });
