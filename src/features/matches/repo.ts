import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Exactly the columns lib/matching scores on. */
export const MATCH_PROFILE_SELECT = {
  id: true, gender: true, dateOfBirth: true, heightCm: true, city: true,
  state: true, annualIncome: true, highestEducation: true, designation: true,
  maritalStatus: true, motherTongue: true, languages: true, religion: true,
  caste: true, familyType: true, familyValues: true, diet: true,
  smoking: true, drinking: true, wantKids: true, openToRelocate: true,
} as const;

export function findCandidates(where: Prisma.ProfileWhereInput, take: number) {
  return prisma.profile.findMany({ where, select: MATCH_PROFILE_SELECT, take });
}

export function findExistingMatches(clientId: string) {
  return prisma.match.findMany({
    where: { clientId },
    select: { candidateId: true, status: true, pairHash: true },
  });
}

export function listMatches(clientId: string) {
  return prisma.match.findMany({
    where: { clientId, status: { notIn: ["SKIPPED"] } },
    orderBy: [{ status: "asc" }, { ruleScore: "desc" }],
    include: {
      candidate: {
        select: {
          id: true, firstName: true, lastName: true, photoUrl: true,
          dateOfBirth: true, heightCm: true, city: true, designation: true,
          highestEducation: true, degree: true, motherTongue: true,
          diet: true, isVerified: true, annualIncome: true,
        },
      },
    },
  });
}

export type MatchRow = Awaited<ReturnType<typeof listMatches>>[number];
