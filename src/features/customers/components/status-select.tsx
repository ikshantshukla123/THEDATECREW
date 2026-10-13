"use client";

import { useTransition } from "react";
import type { PipelineStatus } from "@prisma/client";
import { toast } from "sonner";
import { titleCase } from "@/lib/format";
import { ALLOWED_TRANSITIONS } from "../transitions";
import { updateStatusAction } from "../actions";

export function StatusSelect({
  profileId,
  current,
}: {
  profileId: string;
  current: PipelineStatus;
}) {
  const [pending, startTransition] = useTransition();
  const options = ALLOWED_TRANSITIONS[current];

  function onChange(status: string) {
    startTransition(async () => {
      const result = await updateStatusAction({ profileId, status });
      if (result.ok) toast.success(`Moved to ${titleCase(status)}`);
      else toast.error(result.error.message);
    });
  }

  if (options.length === 0) {
    return (
      <p className="text-[13px] text-fg-subtle">
        {titleCase(current)} is a final stage.
      </p>
    );
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-fg-muted">Status</span>
      <select
        value={current}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-fg disabled:opacity-60"
      >
        <option value={current}>{titleCase(current)}</option>
        {options.map((s) => (
          <option key={s} value={s}>
            Move to {titleCase(s)}
          </option>
        ))}
      </select>
    </label>
  );
}
