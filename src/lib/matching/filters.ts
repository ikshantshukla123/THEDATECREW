import type { Prisma } from "@prisma/client";
import { MS_PER_YEAR, type MatchProfile, type Preference } from "./types";

/**
 * Stage 1: hard filters pushed into Postgres so the engine only scores a
 * plausible shortlist. Everything here is a dealbreaker, not a preference.
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

  if (!preference) return where;

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

  where.maritalStatus = preference.acceptDivorced
    ? { not: "ANNULLED" }
    : "NEVER_MARRIED";

  // A hard yes/no on children is a dealbreaker against the opposite answer.
  if (client.wantKids === "YES") where.wantKids = { not: "NO" };
  else if (client.wantKids === "NO") where.wantKids = { not: "YES" };

  return where;
}
