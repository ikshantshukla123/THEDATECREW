import type { Metadata } from "next";
import Link from "next/link";
import type { PipelineStatus } from "@prisma/client";
import { ScrollablePage } from "@/components/layout/page-shell";
import { requireSession } from "@/lib/auth/session";
import { getDashboardAnalytics } from "@/features/analytics/service";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS_BAR } from "@/components/shared/status-colors";
import { NEEDS_ATTENTION_DAYS, relativeTime, titleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Analytics" };

/** Pipeline order is the funnel order — stages, not categories. */
const FUNNEL: PipelineStatus[] = [
  "NEW", "VERIFIED", "SHORTLISTING", "MATCH_SENT",
  "MEETING_SCHEDULED", "MATCHED", "ON_HOLD", "CLOSED",
];

export default async function AnalyticsPage() {
  const session = await requireSession();
  const { kpis, pipeline, needsAttention, tiers } =
    await getDashboardAnalytics(session.matchmakerId);

  const peak = Math.max(1, ...FUNNEL.map((s) => pipeline[s] ?? 0));

  return (
    <ScrollablePage>
      <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-[28px] leading-9 text-fg">Analytics</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Your book of work at a glance.
        </p>
      </div>

      {/* Stat tiles, not charts — a single number has no shape worth plotting. */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active clients" value={kpis.active} hint={`${kpis.total} total`} />
        <Stat label="Matches sent this week" value={kpis.matchesSentThisWeek} />
        <Stat label="Meetings scheduled" value={kpis.meetings} />
        <Stat
          label="Acceptance rate"
          value={kpis.acceptanceRate === null ? "—" : `${Math.round(kpis.acceptanceRate * 100)}%`}
          hint={kpis.answered === 0 ? "No replies yet" : `${kpis.answered} answered`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Pipeline" subtitle="Clients by stage">
          {/* Each bar wears its own status colour so the funnel and the
              table badges read as one system — UI-UX.md §7.8. */}
          <ul className="flex flex-col gap-3">
            {FUNNEL.map((status) => {
              const count = pipeline[status] ?? 0;
              return (
                <li key={status} className="grid grid-cols-[132px_1fr_28px] items-center gap-3">
                  <span className="truncate text-[13px] text-fg-muted">
                    {titleCase(status)}
                  </span>
                  <span className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className={`block h-full rounded-full transition-[width] ${STATUS_BAR[status]}`}
                      style={{ width: `${(count / peak) * 100}%` }}
                    />
                  </span>
                  <span className="tnum text-right text-[13px] font-medium text-fg">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title="Match tiers"
          subtitle="AI tier across sent matches"
        >
          {tiers.length === 0 ? (
            <Empty>
              No matches sent yet. Tier distribution appears once the matching
              engine has run for a client.
            </Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {tiers.map((t) => (
                <li key={String(t.aiTier)} className="flex items-center justify-between">
                  <span className="text-[13px] text-fg-muted">
                    {t.aiTier ? titleCase(t.aiTier) : "Unrated"}
                  </span>
                  <span className="tnum text-[13px] font-medium text-fg">{t._count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <Panel
        title="Needs attention"
        subtitle={`No contact in over ${NEEDS_ATTENTION_DAYS} days`}
      >
        {needsAttention.length === 0 ? (
          <Empty>Everyone has been contacted recently. Nothing to chase.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {needsAttention.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-muted"
                >
                  <Avatar
                    firstName={c.firstName}
                    lastName={c.lastName}
                    photoUrl={c.photoUrl}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="truncate text-[13px] text-fg-muted">{c.city}</p>
                  </div>
                  <span className="hidden sm:block">
                    {c.pipeline && <StatusBadge status={c.pipeline.status} />}
                  </span>
                  <span className="shrink-0 text-[13px] text-warning-text">
                    {relativeTime(c.pipeline?.lastContactAt ?? null)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      </div>
    </ScrollablePage>
  );
}

function Stat({
  label, value, hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-[13px] font-medium text-fg-muted">{label}</p>
      <p className="tnum mt-2 font-display text-[32px] leading-none text-fg">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}

function Panel({
  title, subtitle, children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      <p className="mt-0.5 mb-5 text-[13px] text-fg-muted">{subtitle}</p>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[13px] text-fg-muted">
      {children}
    </p>
  );
}
