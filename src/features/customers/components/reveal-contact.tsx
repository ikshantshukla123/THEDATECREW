"use client";

import { useState, useTransition } from "react";
import { Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { revealContactAction } from "../actions";

/** Masked by default; revealing is logged to the activity timeline. */
export function RevealContact({ profileId }: { profileId: string }) {
  const [contact, setContact] = useState<{ email: string; phone: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function reveal() {
    startTransition(async () => {
      const result = await revealContactAction({ profileId });
      if (result.ok) setContact(result.data);
      else toast.error(result.error.message);
    });
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  }

  if (!contact) {
    return (
      <div className="flex flex-col gap-3">
        <Field label="Email" value="••••••••@••••••.com" />
        <Field label="Phone" value="+91 ••••• •••••" />
        <button
          type="button"
          onClick={reveal}
          disabled={pending}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          <Eye className="size-4" aria-hidden />
          {pending ? "Revealing…" : "Reveal contact details"}
        </button>
        <p className="text-xs text-fg-subtle">Revealing is recorded in the activity log.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {[
        { label: "Email", value: contact.email },
        { label: "Phone", value: contact.phone },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-end justify-between gap-3">
          <Field label={label} value={value} />
          <button
            type="button"
            onClick={() => copy(value, label)}
            aria-label={`Copy ${label.toLowerCase()}`}
            className="rounded-md p-2 text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg"
          >
            <Copy className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[13px] text-fg-muted">{label}</p>
      <p className="truncate text-sm text-fg">{value}</p>
    </div>
  );
}
