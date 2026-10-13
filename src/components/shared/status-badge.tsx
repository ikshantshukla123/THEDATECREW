import type { PipelineStatus } from "@prisma/client";
import { titleCase } from "@/lib/format";

/** Soft fill plus dark text of the same hue — UI-UX.md §3.3. */
const STYLES: Record<PipelineStatus, string> = {
  NEW: "bg-[#EEF0F4] text-[#0F1B2D] dark:bg-[#1D222A] dark:text-[#C7CCD6]",
  VERIFIED: "bg-verified-soft text-[#1F4A6B] dark:text-[#9CC4E4]",
  SHORTLISTING: "bg-[#EEEBF6] text-[#4A3D7A] dark:bg-[#231E33] dark:text-[#BDB0E0]",
  MATCH_SENT: "bg-primary-soft text-[#154236] dark:text-[#8FD3BA]",
  MEETING_SCHEDULED: "bg-[#FBEEE6] text-[#8A4B1F] dark:bg-[#33241A] dark:text-[#E0AC84]",
  ON_HOLD: "bg-[#F1EEE8] text-[#5F6470] dark:bg-[#24262B] dark:text-[#A7ADB8]",
  MATCHED: "bg-accent-soft text-accent-text",
  CLOSED: "bg-[#F0F0F0] text-[#555B66] dark:bg-[#202227] dark:text-[#9095A0]",
};

export function StatusBadge({ status }: { status: PipelineStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STYLES[status]}`}
    >
      {titleCase(status)}
    </span>
  );
}
