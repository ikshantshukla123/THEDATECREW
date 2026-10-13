import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ScrollablePage } from "@/components/layout/page-shell";
import { requireSession } from "@/lib/auth/session";
import { getClientDetail } from "@/features/customers/service";
import { NotFoundError } from "@/lib/errors";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { ProfileTabs } from "@/features/customers/components/profile-tabs";
import { StatusSelect } from "@/features/customers/components/status-select";
import { age, formatHeight, formatIncome, relativeTime, titleCase } from "@/lib/format";

export default async function ClientLayout({
  children,
  params,
}: LayoutProps<"/customers/[id]">) {
  const { id } = await params;
  const session = await requireSession();

  let client;
  try {
    client = await getClientDetail(session.matchmakerId, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <ScrollablePage>
      <div className="flex flex-col gap-5">
      <Link
        href="/customers"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All clients
      </Link>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* Profile panel */}
        <aside className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-0 lg:self-start">
          <Avatar
            firstName={client.firstName}
            lastName={client.lastName}
            photoUrl={client.photoUrl}
            size={96}
            className="mx-auto"
          />
          <div className="text-center">
            <h1 className="flex items-center justify-center gap-1.5 font-display text-[22px] leading-tight text-fg">
              {client.firstName} {client.lastName}
              {client.isVerified && <VerifiedBadge />}
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              {age(client.dateOfBirth)} · {formatHeight(client.heightCm)}
            </p>
            <p className="text-sm text-fg-muted">{client.city}</p>
          </div>

          <div className="flex justify-center">
            {client.pipeline && <StatusBadge status={client.pipeline.status} />}
          </div>

          <dl className="flex flex-col gap-2.5 border-t border-border pt-4 text-[13px]">
            <Row label="Role" value={client.designation} />
            <Row label="Income" value={formatIncome(client.annualIncome)} />
            <Row label="Community" value={client.religion} />
            <Row label="Diet" value={titleCase(client.diet)} />
            <Row label="Matchmaker" value={client.matchmaker?.name ?? "—"} />
          </dl>
        </aside>

        {/* Tabs + content */}
        <div className="flex min-w-0 flex-col gap-5">
          <ProfileTabs profileId={client.id} />
          {children}
        </div>

        {/* Quick actions */}
        <aside className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-0 lg:self-start">
          <h2 className="text-sm font-semibold text-fg">Quick actions</h2>

          {client.pipeline && (
            <StatusSelect profileId={client.id} current={client.pipeline.status} />
          )}

          <div className="border-t border-border pt-4">
            <p className="text-[13px] text-fg-muted">Last contacted</p>
            <p className="mt-0.5 text-sm text-fg">
              {relativeTime(client.pipeline?.lastContactAt ?? null)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            <Metric label="Matches" value={client._count.matchesAsClient} />
            <Metric label="Notes" value={client._count.notes} />
            <Metric label="Events" value={client._count.activities} />
          </div>
        </aside>
        </div>
      </div>
    </ScrollablePage>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-fg-muted">{label}</dt>
      <dd className="truncate text-right text-fg">{value ?? "Not specified"}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="tnum text-lg font-semibold text-fg">{value}</p>
      <p className="text-xs text-fg-subtle">{label}</p>
    </div>
  );
}
