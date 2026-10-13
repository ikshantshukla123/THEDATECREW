import "server-only";
import type { PipelineStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NEEDS_ATTENTION_DAYS } from "@/lib/format";

/** Every query is scoped to the signed-in matchmaker. */
export async function getKpis(matchmakerId: string) {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const client = { isClient: true as const, matchmakerId };

  const [total, active, matchesSentThisWeek, meetings, accepted, declined] =
    await Promise.all([
      prisma.profile.count({ where: client }),
      prisma.profile.count({
        where: { ...client, pipeline: { is: { status: { not: "CLOSED" } } } },
      }),
      prisma.match.count({
        where: { client, status: "SENT", sentAt: { gte: weekAgo } },
      }),
      prisma.profile.count({
        where: { ...client, pipeline: { is: { status: "MEETING_SCHEDULED" } } },
      }),
      prisma.match.count({ where: { client, status: "ACCEPTED" } }),
      prisma.match.count({ where: { client, status: "DECLINED" } }),
    ]);

  const answered = accepted + declined;
  return {
    total,
    active,
    matchesSentThisWeek,
    meetings,
    acceptanceRate: answered === 0 ? null : accepted / answered,
    answered,
  };
}

export async function getPipeline(matchmakerId: string) {
  const grouped = await prisma.customerPipeline.groupBy({
    by: ["status"],
    where: { profile: { isClient: true, matchmakerId } },
    _count: true,
  });
  return Object.fromEntries(grouped.map((g) => [g.status, g._count])) as
    Partial<Record<PipelineStatus, number>>;
}

export function getNeedsAttention(matchmakerId: string) {
  const cutoff = new Date(Date.now() - NEEDS_ATTENTION_DAYS * 86_400_000);
  return prisma.profile.findMany({
    where: {
      isClient: true,
      matchmakerId,
      pipeline: {
        is: {
          // On Hold means "do not contact for now", so it is not a chase.
          status: { notIn: ["CLOSED", "MATCHED", "ON_HOLD"] },
          OR: [{ lastContactAt: null }, { lastContactAt: { lt: cutoff } }],
        },
      },
    },
    select: {
      id: true, firstName: true, lastName: true, city: true, photoUrl: true,
      pipeline: { select: { status: true, lastContactAt: true } },
    },
    orderBy: { pipeline: { lastContactAt: "asc" } },
    take: 8,
  });
}

export async function getTierDistribution(matchmakerId: string) {
  const grouped = await prisma.match.groupBy({
    by: ["aiTier"],
    where: {
      client: { isClient: true, matchmakerId },
      status: { in: ["SENT", "ACCEPTED", "DECLINED"] },
    },
    _count: true,
  });
  return grouped;
}
