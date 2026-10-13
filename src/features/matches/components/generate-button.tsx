"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateMatchesAction } from "../actions";

export function GenerateButton({
  clientId,
  hasMatches,
}: {
  clientId: string;
  hasMatches: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await generateMatchesAction({ clientId });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      const { generated, aiUsed, aiReason } = result.data;
      if (generated === 0) {
        toast.warning("No candidates passed this client's filters");
      } else if (aiUsed) {
        toast.success(`${generated} matches ranked with AI`);
      } else {
        toast.warning(`${generated} matches ranked by rules — AI unavailable`, {
          description: aiReason ?? undefined,
        });
      }
      router.refresh();
    });
  }

  const Icon = hasMatches ? RefreshCw : Sparkles;
  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      <Icon className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden />
      {pending ? "Ranking…" : hasMatches ? "Refresh matches" : "Generate matches"}
    </button>
  );
}
