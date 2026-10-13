import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { age, needsAttention, relativeTime, titleCase } from "@/lib/format";
import type { ClientRow } from "../repo";

const COLUMNS = [
  { label: "Name", className: "w-[26%]" },
  { label: "Age", className: "w-[7%]" },
  { label: "City", className: "w-[14%]" },
  { label: "Marital status", className: "w-[14%]" },
  { label: "Status", className: "w-[15%]" },
  { label: "Last contacted", className: "w-[14%]" },
  { label: "Matches", className: "w-[8%]" },
  { label: "", className: "w-[4%]" },
];

/**
 * The card fills its parent and scrolls only `tbody` — the header row stays
 * pinned via a sticky thead inside the scroll container.
 */
export function CustomerTable({ rows }: { rows: ClientRow[] }) {
  return (
    <>
      <div className="hidden min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface lg:flex lg:flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <table className="w-full table-fixed text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-muted text-left">
                {COLUMNS.map((col, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`${col.className} border-b border-border px-4 py-3 text-[13px] font-medium text-fg-muted`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-border transition-colors last:border-0 hover:bg-surface-muted ${
                    i % 2 ? "bg-surface-muted/40" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${c.id}`}
                      className="flex items-center gap-3 font-medium text-fg"
                    >
                      <Avatar
                        firstName={c.firstName}
                        lastName={c.lastName}
                        photoUrl={c.photoUrl}
                        size={36}
                      />
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">
                          {c.firstName} {c.lastName}
                        </span>
                        {c.isVerified && <VerifiedBadge className="shrink-0" />}
                      </span>
                    </Link>
                  </td>
                  <td className="tnum px-4 py-3 text-fg-muted">{age(c.dateOfBirth)}</td>
                  <td className="truncate px-4 py-3 text-fg-muted">{c.city}</td>
                  <td className="truncate px-4 py-3 text-fg-muted">
                    {titleCase(c.maritalStatus)}
                  </td>
                  <td className="px-4 py-3">
                    {c.pipeline && <StatusBadge status={c.pipeline.status} />}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      {needsAttention(c.pipeline?.lastContactAt ?? null) && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-warning"
                          title="No contact in over 14 days"
                        />
                      )}
                      {relativeTime(c.pipeline?.lastContactAt ?? null)}
                    </span>
                  </td>
                  <td className="tnum px-4 py-3 text-fg-muted">{c._count.matchesAsClient}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${c.id}`}
                      aria-label={`Open ${c.firstName} ${c.lastName}`}
                    >
                      <ChevronRight className="size-4 text-fg-subtle" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: the card list is the scroll container. */}
      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain lg:hidden">
        {rows.map((c) => (
          <li key={c.id}>
            <Link
              href={`/customers/${c.id}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-muted"
            >
              <Avatar
                firstName={c.firstName}
                lastName={c.lastName}
                photoUrl={c.photoUrl}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-medium text-fg">
                  <span className="truncate">
                    {c.firstName} {c.lastName}, {age(c.dateOfBirth)}
                  </span>
                  {c.isVerified && <VerifiedBadge className="shrink-0" />}
                </p>
                <p className="truncate text-[13px] text-fg-muted">
                  {c.designation} · {c.city}
                </p>
                <p className="mt-1 text-xs text-fg-subtle">
                  {relativeTime(c.pipeline?.lastContactAt ?? null)}
                </p>
              </div>
              {c.pipeline && <StatusBadge status={c.pipeline.status} />}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
