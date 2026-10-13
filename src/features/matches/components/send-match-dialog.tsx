"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/shared/avatar";
import { TierBadge } from "./tier-badge";
import { age, formatHeight, titleCase } from "@/lib/format";
import { getIntroAction, sendMatchAction } from "../actions";
import type { MatchRow } from "../repo";

export function SendMatchDialog({
  match,
  clientId,
  clientFirstName,
  onClose,
}: {
  match: MatchRow;
  clientId: string;
  clientFirstName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const c = match.candidate;

  // showModal gives focus trapping and Esc for free.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getIntroAction({ clientId, matchId: match.id }).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setSubject(result.data.subject);
        setBody(result.data.body);
        setSource(result.data.source);
      } else {
        toast.error(result.error.message);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, match.id]);

  function regenerate() {
    setLoading(true);
    startTransition(async () => {
      const result = await getIntroAction({ clientId, matchId: match.id, regenerate: true });
      if (result.ok) {
        setSubject(result.data.subject);
        setBody(result.data.body);
        setSource(result.data.source);
      } else {
        toast.error(result.error.message);
      }
      setLoading(false);
    });
  }

  function send() {
    startTransition(async () => {
      const result = await sendMatchAction({ clientId, matchId: match.id, subject, body });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Match sent to ${clientFirstName}`, {
        description: result.data.movedPipeline ? "Moved to Match Sent" : undefined,
      });
      onClose();
      router.refresh();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-[min(880px,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-0 text-fg backdrop:bg-ink/50"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display text-lg text-fg">Send match to {clientFirstName}</h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid max-h-[70vh] gap-5 overflow-y-auto p-5 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-4">
          <Avatar firstName={c.firstName} lastName={c.lastName} photoUrl={c.photoUrl} size={72} className="mx-auto" />
          <div className="text-center">
            <p className="font-display text-base text-fg">
              {c.firstName} {c.lastName}, {age(c.dateOfBirth)}
            </p>
            <p className="mt-0.5 text-[13px] text-fg-muted">
              {formatHeight(c.heightCm)} · {c.city}
            </p>
            <p className="text-[13px] text-fg-muted">{c.designation}</p>
            <p className="text-[13px] text-fg-muted">
              {c.motherTongue} · {titleCase(c.diet)}
            </p>
          </div>
          <div className="flex justify-center">{match.aiTier && <TierBadge tier={match.aiTier} />}</div>
        </aside>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-fg-muted">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-fg disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-fg-muted">
              Message
              <span className="tnum font-normal text-fg-subtle">
                {body.trim() ? body.trim().split(/\s+/).length : 0} words
              </span>
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={loading}
              rows={12}
              className="w-full resize-y rounded-md border border-border bg-surface px-3.5 py-3 text-sm whitespace-pre-wrap text-fg disabled:opacity-60"
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={regenerate}
                disabled={loading || pending}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary transition-opacity hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
                Regenerate
              </button>
              {source === "template" && (
                <span className="text-xs text-warning-text">Written from a template — AI unavailable</span>
              )}
              {source === "cached" && <span className="text-xs text-fg-subtle">Saved draft</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                className="min-h-10 rounded-md px-4 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={loading || pending || !subject.trim() || !body.trim()}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                {pending ? "Sending…" : "Send match"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
