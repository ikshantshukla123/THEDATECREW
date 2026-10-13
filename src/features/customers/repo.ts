import "server-only";
import type { Gender, PipelineStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NEEDS_ATTENTION_DAYS } from "@/lib/format";

export type CustomerFilters = {
  search?: string;
  status?: PipelineStatus;
  gender?: Gender;
  needsAttention?: boolean;
  page: number;
  perPage: number;
};

/**
 * Every query takes matchmakerId and filters by it. Authorization lives at
 * the data layer, not just the UI — a missing scope here is a data leak.
 */
function scope(matchmakerId: string, f: CustomerFilters): Prisma.ProfileWhereInput {
  const where: Prisma.ProfileWhereInput = { isClient: true, matchmakerId };

  if (f.search) {
    where.OR = [
      { firstName: { contains: f.search, mode: "insensitive" } },
      { lastName: { contains: f.search, mode: "insensitive" } },
      { city: { contains: f.search, mode: "insensitive" } },
    ];
  }
  if (f.gender) where.gender = f.gender;

  // Status and "needs attention" both filter the 1:1 pipeline row, so they
  // have to be composed into one `is` rather than overwriting each other.
  const pipeline: Prisma.CustomerPipelineWhereInput = {};
  if (f.status) pipeline.status = f.status;
  if (f.needsAttention) {
    const cutoff = new Date(Date.now() - NEEDS_ATTENTION_DAYS * 86_400_000);
    pipeline.OR = [{ lastContactAt: null }, { lastContactAt: { lt: cutoff } }];
    // Same rule as analytics: paused and finished clients are not a chase.
    // Only when no explicit status chip is active, or it would clobber it.
    if (!f.status) pipeline.status = { notIn: ["CLOSED", "MATCHED", "ON_HOLD"] };
  }
  if (Object.keys(pipeline).length > 0) where.pipeline = { is: pipeline };

  return where;
}

export async function listClients(matchmakerId: string, f: CustomerFilters) {
  const where = scope(matchmakerId, f);

  const [rows, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      // Select only what the table renders — not the whole row.
      select: {
        id: true, firstName: true, lastName: true, gender: true,
        dateOfBirth: true, city: true, state: true, photoUrl: true,
        isVerified: true, maritalStatus: true, designation: true,
        pipeline: { select: { status: true, lastContactAt: true } },
        _count: { select: { matchesAsClient: true } },
      },
      orderBy: [{ pipeline: { lastContactAt: "desc" } }, { firstName: "asc" }],
      skip: (f.page - 1) * f.perPage,
      take: f.perPage,
    }),
    prisma.profile.count({ where }),
  ]);

  return { rows, total };
}

/** Counts for the status chip row, scoped to this matchmaker. */
export async function countByStatus(matchmakerId: string) {
  const grouped = await prisma.customerPipeline.groupBy({
    by: ["status"],
    where: { profile: { isClient: true, matchmakerId } },
    _count: true,
  });
  return Object.fromEntries(grouped.map((g) => [g.status, g._count])) as
    Partial<Record<PipelineStatus, number>>;
}

export type ClientRow = Awaited<ReturnType<typeof listClients>>["rows"][number];

/** Scoped by matchmakerId: a miss is NotFound, never a leak. */
export function findClientById(matchmakerId: string, profileId: string) {
  return prisma.profile.findFirst({
    where: { id: profileId, isClient: true, matchmakerId },
    include: {
      preference: true,
      pipeline: true,
      matchmaker: { select: { id: true, name: true } },
      _count: { select: { matchesAsClient: true, notes: true, activities: true } },
    },
  });
}

export type ClientDetail = NonNullable<Awaited<ReturnType<typeof findClientById>>>;
