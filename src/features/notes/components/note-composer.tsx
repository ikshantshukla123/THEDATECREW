"use client";

import { useState, useTransition } from "react";
import { Phone, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addNoteAction } from "../actions";

const TYPES = [
  { value: "CALL", label: "Call", Icon: Phone },
  { value: "MEETING", label: "Meeting", Icon: Users },
  { value: "GENERAL", label: "Note", Icon: FileText },
] as const;

export function NoteComposer({ profileId }: { profileId: string }) {
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("CALL");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addNoteAction({ profileId, type, body });
      if (result.ok) {
        setBody("");
        toast.success("Note saved");
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-3 flex gap-2">
        {TYPES.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            aria-pressed={type === value}
            className={cn(
              "inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors",
              type === value
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-fg-muted hover:bg-surface-muted",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        // Cmd/Ctrl+Enter saves — UI-UX.md §7.6.
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
        }}
        rows={4}
        placeholder="What did you discuss?"
        className="w-full resize-y rounded-md border border-border bg-surface px-3.5 py-3 text-sm text-fg placeholder:text-fg-subtle"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-fg-subtle">
          {type === "GENERAL"
            ? "General notes do not update last contacted."
            : "Saving updates last contacted."}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={pending || !body.trim()}
          className="min-h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save note"}
        </button>
      </div>
    </div>
  );
}
