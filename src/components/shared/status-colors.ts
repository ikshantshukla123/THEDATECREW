import type { PipelineStatus } from "@prisma/client";

/**
 * Bar fills for the pipeline chart, matched to the badge hues in
 * UI-UX.md §3.3 so the funnel and the table read as one system.
 */
export const STATUS_BAR: Record<PipelineStatus, string> = {
  NEW: "bg-[#8E97A8] dark:bg-[#6E7686]",
  VERIFIED: "bg-verified",
  SHORTLISTING: "bg-[#6B5BA8] dark:bg-[#8578C0]",
  MATCH_SENT: "bg-primary",
  MEETING_SCHEDULED: "bg-[#C2762F] dark:bg-[#D9954F]",
  ON_HOLD: "bg-[#9A9287] dark:bg-[#7E776D]",
  MATCHED: "bg-accent",
  CLOSED: "bg-[#B8BCC4] dark:bg-[#5A5F68]",
};
