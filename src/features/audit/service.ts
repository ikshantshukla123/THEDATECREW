import "server-only";
import type { ActivityType, Prisma } from "@prisma/client";
import type { Tx } from "@/lib/db";

/**
 * Called with the transaction client so the log can never drift from the
 * mutation it describes — ARCHITECTURE.md §12.
 */
export function logActivity(
  tx: Tx,
  entry: {
    actorId: string;
    profileId: string;
    type: ActivityType;
    payload: Prisma.InputJsonValue;
  },
) {
  return tx.activityLog.create({ data: entry });
}
