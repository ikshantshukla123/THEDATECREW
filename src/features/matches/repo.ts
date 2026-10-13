import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Exactly the columns lib/matching scores on. */
export const MATCH_PROFILE_SELECT = {
  id: true, gender: true, dateOfBirth: true, heightCm: true, city: true,
  state: true, annualIncome: true, highestEducation: true, designation: true,
  maritalStatus: true, motherTongue: true, languages: true, religion: true,
  caste: true, manglik: true, familyType: true, familyValues: true, diet: true,
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

/**
 * How many OTHER clients each candidate is in play with. The pool is shared
 * across matchmakers, so the same person can be shortlisted several times —
 * worth knowing before you send.
 *
 * Match is unique on (clientId, candidateId), so a row count is a distinct
 * client count. One grouped query, not one per card.
 */
export async function countCandidateOverlap(candidateIds: string[], excludeClientId: string) {
  if (candidateIds.length === 0) return new Map<string, { shortlisted: number; sent: number }>();

  const base = {
    candidateId: { in: candidateIds },
    clientId: { not: excludeClientId },
  };

  const [shortlisted, sent] = await Promise.all([
    prisma.match.groupBy({
      by: ["candidateId"],
      where: { ...base, status: { notIn: ["SKIPPED"] } },
      _count: true,
    }),
    prisma.match.groupBy({
      by: ["candidateId"],
      where: { ...base, status: { in: ["SENT", "ACCEPTED", "DECLINED"] } },
      _count: true,
    }),
  ]);

  const sentBy = new Map(sent.map((r) => [r.candidateId, r._count]));
  return new Map(
    shortlisted.map((r) => [
      r.candidateId,
      { shortlisted: r._count, sent: sentBy.get(r.candidateId) ?? 0 },
    ]),
  );
}

export type CandidateOverlap = { shortlisted: number; sent: number };
