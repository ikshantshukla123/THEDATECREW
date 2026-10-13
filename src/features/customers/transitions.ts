import type { PipelineStatus } from "@prisma/client";

/** ARCHITECTURE.md §8. ON_HOLD returns to whatever stage preceded it. */
export const ALLOWED_TRANSITIONS: Record<PipelineStatus, PipelineStatus[]> = {
  NEW: ["VERIFIED", "ON_HOLD", "CLOSED"],
  VERIFIED: ["SHORTLISTING", "ON_HOLD", "CLOSED"],
  SHORTLISTING: ["MATCH_SENT", "ON_HOLD", "CLOSED"],
  MATCH_SENT: ["MEETING_SCHEDULED", "SHORTLISTING", "ON_HOLD", "CLOSED"],
  MEETING_SCHEDULED: ["MATCHED", "SHORTLISTING", "ON_HOLD", "CLOSED"],
  ON_HOLD: ["NEW", "VERIFIED", "SHORTLISTING", "MATCH_SENT", "MEETING_SCHEDULED", "CLOSED"],
  MATCHED: ["CLOSED"],
  CLOSED: [],
};

export function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
