import { createHash } from "node:crypto";
import type { MatchProfile, Preference } from "./types";

/** Only the fields that affect scoring; cosmetic edits must not invalidate. */
function fingerprint(p: MatchProfile): string {
  return [
    p.id, p.dateOfBirth.getTime(), p.heightCm, p.city, p.state, p.annualIncome,
    p.highestEducation, p.maritalStatus, p.motherTongue, [...p.languages].sort().join(","),
    p.religion, p.caste, p.familyType, p.familyValues, p.diet, p.smoking,
    p.drinking, p.wantKids, p.openToRelocate,
  ].join("|");
}

export function pairHash(
  client: MatchProfile,
  candidate: MatchProfile,
  preference: Preference | null,
): string {
  const pref = preference
    ? JSON.stringify({
        minAge: preference.minAge, maxAge: preference.maxAge,
        minHeightCm: preference.minHeightCm, maxHeightCm: preference.maxHeightCm,
        minIncome: preference.minIncome,
        religions: [...preference.religions].sort(),
        castes: [...preference.castes].sort(),
        casteNoBar: preference.casteNoBar,
        motherTongues: [...preference.motherTongues].sort(),
        cities: [...preference.cities].sort(),
        diets: [...preference.diets].sort(),
        acceptDivorced: preference.acceptDivorced,
        manglikMatters: preference.manglikMatters,
        weightOverrides: preference.weightOverrides ?? null,
      })
    : "none";

  return createHash("sha256")
    .update(`${fingerprint(client)}::${fingerprint(candidate)}::${pref}`)
    .digest("hex");
}
