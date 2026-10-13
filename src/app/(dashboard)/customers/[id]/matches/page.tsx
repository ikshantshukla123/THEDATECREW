import { requireSession } from "@/lib/auth/session";
import { getClientDetail } from "@/features/customers/service";
import { getMatches } from "@/features/matches/service";
import { MatchCard } from "@/features/matches/components/match-card";
import { GenerateButton } from "@/features/matches/components/generate-button";
import { isAiEnabled } from "@/lib/env";
import { EmptyState } from "@/components/shared/empty-state";

export default async function MatchesPage({
  params,
}: PageProps<"/customers/[id]/matches">) {
  const { id } = await params;
  const session = await requireSession();
  const client = await getClientDetail(session.matchmakerId, id);
  const matches = await getMatches(id);

  const ruleOnly = matches.length > 0 && matches.every((m) => m.aiModel === null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">
            Suggested matches for {client.firstName}
          </h2>
          <p className="mt-0.5 text-[13px] text-fg-muted">
            {matches.length > 0
              ? `${matches.length} ranked against her preferences`.replace("her", client.gender === "MALE" ? "his" : "her")
              : "Nothing generated yet"}
          </p>
        </div>
        <GenerateButton clientId={client.id} hasMatches={matches.length > 0} />
      </div>

      {!isAiEnabled && (
        <p className="rounded-md border border-border bg-surface-muted px-4 py-3 text-[13px] text-fg-muted">
          AI is not configured, so rankings use the rule-based engine only.
        </p>
      )}
      {isAiEnabled && ruleOnly && (
        <p className="rounded-md border border-warning/30 bg-warning/8 px-4 py-3 text-[13px] text-warning-text">
          Showing rule-based ranking — AI insights were unavailable when these were generated.
        </p>
      )}

      {matches.length === 0 ? (
        <EmptyState
          title={`No matches for ${client.firstName} yet`}
          description="Generate a shortlist to rank the candidate pool against this client's preferences. Every suggestion comes with the reasons behind its score."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              clientId={client.id}
              clientFirstName={client.firstName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
