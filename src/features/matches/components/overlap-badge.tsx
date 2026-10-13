import { Users } from "lucide-react";
import type { CandidateOverlap } from "../repo";

/**
 * The candidate pool is shared across matchmakers, so the same person can be
 * in play with several clients at once. Already being sent to someone else is
 * a real signal; merely sitting on another shortlist is only context.
 */
export function OverlapBadge({ overlap }: { overlap: CandidateOverlap }) {
  if (overlap.shortlisted === 0) return null;

  const plural = (n: number) => (n === 1 ? "client" : "clients");

  if (overlap.sent > 0) {
    return (
      <span
        title="This profile has already been introduced to other clients"
        className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning-text"
      >
        <Users className="size-3.5 shrink-0" aria-hidden />
        Already sent to {overlap.sent} other {plural(overlap.sent)}
      </span>
    );
  }

  return (
    <span
      title="This profile is on other matchmakers' shortlists too"
      className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-fg-muted"
    >
      <Users className="size-3.5 shrink-0" aria-hidden />
      Shortlisted for {overlap.shortlisted} other {plural(overlap.shortlisted)}
    </span>
  );
}
