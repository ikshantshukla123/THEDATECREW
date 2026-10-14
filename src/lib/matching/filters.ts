import type { Prisma } from "@prisma/client";
import { MS_PER_YEAR, type MatchProfile, type Preference } from "./types";

/**
 * Stage 1: hard filters pushed into Postgres so the engine only scores a
 * plausible shortlist. Everything here is a dealbreaker, not a preference.
 *
 * Soft preferences (cities, motherTongues, diets, minIncome) deliberately
 * live in the factors instead — narrowing the pool on them would strand
 * clients with specific tastes on an empty results page.
 */
export function buildCandidateFilter(
  client: MatchProfile,
  preference: Preference | null,
  excludeIds: string[],
  now: Date,
): Prisma.ProfileWhereInput {
  const where: Prisma.ProfileWhereInput = {
    isClient: false,
    isVerified: true,
    gender: client.gender === "MALE" ? "FEMALE" : "MALE",
    id: { notIn: excludeIds },
  };

  // A hard yes/no on children is a dealbreaker against the opposite answer.
  // Driven by the client's own biodata, so it applies with or without a
  // saved preference row.
  if (client.wantKids === "YES") where.wantKids = { not: "NO" };
  else if (client.wantKids === "NO") where.wantKids = { not: "YES" };

  // Sagotra marriage is prohibited in Hindu tradition — a shared gotra means
  // a shared patrilineal ancestor, so the pair is treated as siblings. Driven
  // by the client's own biodata, and only where both sides are Hindu with a
  // gotra on record.
  if (client.religion === "Hindu" && client.gotra) {
    where.NOT = { religion: "Hindu", gotra: client.gotra };
  }

  // No stated preference still means never-married, the house default.
  if (!preference) {
    where.maritalStatus = "NEVER_MARRIED";
    return where;
  }

  // Age range converts to a date-of-birth window.
  if (preference.maxAge !== null || preference.minAge !== null) {
    where.dateOfBirth = {
      ...(preference.maxAge !== null && {
        gte: new Date(now.getTime() - (preference.maxAge + 1) * MS_PER_YEAR),
      }),
      ...(preference.minAge !== null && {
        lte: new Date(now.getTime() - preference.minAge * MS_PER_YEAR),
      }),
    };
  }

  if (preference.minHeightCm !== null || preference.maxHeightCm !== null) {
    where.heightCm = {
      ...(preference.minHeightCm !== null && { gte: preference.minHeightCm }),
      ...(preference.maxHeightCm !== null && { lte: preference.maxHeightCm }),
    };
  }

  if (preference.religions.length > 0) where.religion = { in: preference.religions };
  if (!preference.casteNoBar && preference.castes.length > 0) {
    where.caste = { in: preference.castes };
  }

  // Accepting a second marriage still rules out anyone not yet free to
  // remarry; declining it means never-married only.
  where.maritalStatus = preference.acceptDivorced
    ? { not: "AWAITING_DIVORCE" }
    : "NEVER_MARRIED";

  // Manglik dosha is considered cancelled when both sides carry it, so the
  // rule is "match like with like" rather than "exclude manglik". PARTIAL
  // reads as compatible either way, and an unknown chart asserts nothing.
  if (preference.manglikMatters) {
    if (client.manglik === "YES") where.manglik = { in: ["YES", "PARTIAL"] };
    else if (client.manglik === "NO") where.manglik = { in: ["NO", "PARTIAL"] };
  }

  return where;
}
