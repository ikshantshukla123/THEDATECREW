import {
  ArrowRightLeft, Eye, FileText, Send, Sparkles, SlidersHorizontal, Bookmark, X,
} from "lucide-react";
import type { ActivityType } from "@prisma/client";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getClientDetail } from "@/features/customers/service";
import { relativeTime, titleCase } from "@/lib/format";

const DATETIME = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  STATUS_CHANGED: ArrowRightLeft,
  NOTE_ADDED: FileText,
  MATCHES_GENERATED: Sparkles,
  MATCH_SENT: Send,
  MATCH_SKIPPED: X,
  MATCH_SAVED: Bookmark,
  MATCH_STATUS_CHANGED: ArrowRightLeft,
  PREFERENCES_UPDATED: SlidersHorizontal,
  CONTACT_REVEALED: Eye,
};

/** One human sentence per entry — UI-UX.md §7.7. */
function sentence(
  type: ActivityType,
  payload: unknown,
  actor: string,
  client: string,
): string {
  const p = (payload ?? {}) as Record<string, string>;
  switch (type) {
    case "STATUS_CHANGED":
      return `${actor} moved ${client} from ${titleCase(p.from ?? "")} to ${titleCase(p.to ?? "")}`;
    case "NOTE_ADDED":
      return `${actor} added a ${(p.noteType ?? "general").toLowerCase()} note`;
    case "MATCHES_GENERATED":
      return `${actor} generated new match suggestions`;
    case "MATCH_SENT":
      return `${actor} sent a profile to ${client}`;
    case "MATCH_SKIPPED":
      return `${actor} skipped a suggested match`;
    case "MATCH_SAVED":
      return `${actor} saved a match for later`;
    case "MATCH_STATUS_CHANGED":
      return `${actor} updated a match outcome`;
    case "PREFERENCES_UPDATED":
      return `${actor} updated ${client}'s preferences`;
    case "CONTACT_REVEALED":
      return `${actor} revealed ${client}'s contact details`;
  }
}

export default async function ActivityPage({
  params,
}: PageProps<"/customers/[id]/activity">) {
  const { id } = await params;
  const session = await requireSession();
  const client = await getClientDetail(session.matchmakerId, id);

  const entries = await prisma.activityLog.findMany({
    where: { profileId: id },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
    take: 50,
  });

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-5 py-10 text-center text-sm text-fg-muted">
        Nothing has happened yet. Status changes, notes and sent matches appear here.
      </p>
    );
  }

  return (
    <ol className="flex flex-col">
      {entries.map((entry, i) => {
        const Icon = ICONS[entry.type];
        const last = i === entries.length - 1;
        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              {!last && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className={last ? "pb-0" : "pb-6"}>
              <p className="text-sm text-fg">
                {sentence(entry.type, entry.payload, entry.actor.name, client.firstName)}
              </p>
              <time
                dateTime={entry.createdAt.toISOString()}
                title={DATETIME.format(entry.createdAt)}
                className="text-xs text-fg-subtle"
              >
                {relativeTime(entry.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
