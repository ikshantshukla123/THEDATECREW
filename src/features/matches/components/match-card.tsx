"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Bookmark, Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/shared/avatar";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { ManglikBadge } from "@/components/shared/manglik-badge";
import { age, formatHeight, relativeTime, titleCase } from "@/lib/format";
import { ScoreRing } from "./score-ring";
import { TierBadge } from "./tier-badge";
import { FactorBreakdown } from "./factor-breakdown";
import { SendMatchDialog } from "./send-match-dialog";
import { saveMatchAction, skipMatchAction } from "../actions";
import type { MatchWithOverlap } from "../service";
import { OverlapBadge } from "./overlap-badge";

type Row = { factor: string; weight: number; score: number; reason: string };

export function MatchCard({
  match,
  clientId,
  clientFirstName,
}: {
  match: MatchWithOverlap;
  clientId: string;
  clientFirstName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [sending, setSending] = useState(false);
  const c = match.candidate;
  const reasons = Array.isArray(match.aiReasons) ? (match.aiReasons as string[]) : [];
  const breakdown = Array.isArray(match.ruleBreakdown) ? (match.ruleBreakdown as unknown as Row[]) : [];
  const sent = match.status !== "SUGGESTED" && match.status !== "SAVED";

  function act(fn: typeof skipMatchAction, label: string) {
    startTransition(async () => {
      const result = await fn({ clientId, matchId: match.id });
      if (result.ok) toast.success(label);
      else toast.error(result.error.message);
    });
  }

  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start gap-4">
        <Avatar firstName={c.firstName} lastName={c.lastName} photoUrl={c.photoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-start gap-1.5 font-display text-lg leading-tight text-fg">
                <span>{c.firstName} {c.lastName}, {age(c.dateOfBirth)}</span>
                {c.isVerified && <span className="mt-1 shrink-0"><VerifiedBadge /></span>}
              </p>
              <p className="mt-0.5 text-[13px] text-fg-muted">
                {formatHeight(c.heightCm)} · {c.designation} · {c.city}
              </p>
              <p className="text-[13px] text-fg-muted">
                {c.degree} · {c.motherTongue} · {titleCase(c.diet)}
              </p>
            </div>
            {match.aiTier && <ScoreRing score={match.ruleScore} tier={match.aiTier} />}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {match.aiTier && <TierBadge tier={match.aiTier} />}
            <ManglikBadge manglik={c.manglik} religion={c.religion} />
            <OverlapBadge overlap={match.overlap} />
          </div>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[13px] font-medium text-fg">Why this match</p>
          <ul className="flex flex-col gap-1">
            {reasons.map((reason, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-fg-muted">
                <span aria-hidden className="text-primary">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {match.aiConcern && (
        <p className="mt-3 flex items-start gap-1.5 text-[13px] text-warning-text">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
          {match.aiConcern}
        </p>
      )}

      {breakdown.length > 0 && <FactorBreakdown rows={breakdown} />}

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        {sent ? (
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-medium text-primary">
            {match.status === "SENT" ? `Sent ${relativeTime(match.sentAt)}` : titleCase(match.status)}
          </span>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => act(skipMatchAction, `Skipped ${c.firstName}`)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium whitespace-nowrap text-fg-muted transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              <X className="size-4" aria-hidden /> Skip
            </button>
            <button
              type="button"
              disabled={pending || match.status === "SAVED"}
              onClick={() => act(saveMatchAction, `Saved ${c.firstName} for later`)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-medium whitespace-nowrap text-fg transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              <Bookmark className="size-4" aria-hidden />
              {match.status === "SAVED" ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setSending(true)}
              className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold whitespace-nowrap text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Heart className="size-4" aria-hidden /> Send Match
            </button>
          </>
        )}
      </div>

      {sending && (
        <SendMatchDialog
          match={match}
          clientId={clientId}
          clientFirstName={clientFirstName}
          onClose={() => setSending(false)}
        />
      )}
    </article>
  );
}
