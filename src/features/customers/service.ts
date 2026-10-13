import "server-only";
import type { PipelineStatus } from "@prisma/client";
import { prisma, withRetry } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logActivity } from "@/features/audit/service";
import * as repo from "./repo";
import type { CustomerFilters } from "./repo";
import { canTransition } from "./transitions";
import { titleCase } from "@/lib/format";

export const PER_PAGE = 20;

export async function getClientList(matchmakerId: string, filters: CustomerFilters) {
  const [list, statusCounts] = await Promise.all([
    repo.listClients(matchmakerId, filters),
    repo.countByStatus(matchmakerId),
  ]);

  return {
    ...list,
    statusCounts,
    totalPages: Math.max(1, Math.ceil(list.total / filters.perPage)),
  };
}

export type { CustomerFilters };

export async function getClientDetail(matchmakerId: string, profileId: string) {
  const client = await repo.findClientById(matchmakerId, profileId);
  if (!client) throw new NotFoundError("Client");
  return client;
}

/** Services own transactions; the activity row is written inside it. */
export async function updateStatus(
  matchmakerId: string,
  profileId: string,
  next: PipelineStatus,
) {
  const client = await repo.findClientById(matchmakerId, profileId);
  if (!client?.pipeline) throw new NotFoundError("Client");

  const current = client.pipeline.status;
  if (current === next) return;
  if (!canTransition(current, next)) {
    throw new ValidationError(
      `Cannot move from ${titleCase(current)} to ${titleCase(next)}`,
    );
  }

  await withRetry(() => prisma.$transaction(async (tx) => {
    await tx.customerPipeline.update({
      where: { profileId },
      data: { status: next },
    });
    await logActivity(tx, {
      actorId: matchmakerId,
      profileId,
      type: "STATUS_CHANGED",
      payload: { from: current, to: next },
    });
  }));
}

/** Revealing contact details is itself auditable — §7.3. */
export async function revealContact(matchmakerId: string, profileId: string) {
  const client = await repo.findClientById(matchmakerId, profileId);
  if (!client) throw new NotFoundError("Client");

  await withRetry(() => prisma.$transaction(async (tx) => {
    await logActivity(tx, {
      actorId: matchmakerId,
      profileId,
      type: "CONTACT_REVEALED",
      payload: {},
    });
  }));

  return { email: client.email, phone: client.phone };
}
