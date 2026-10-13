"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { PipelineStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

const STATUSES: PipelineStatus[] = [
  "NEW", "VERIFIED", "SHORTLISTING", "MATCH_SENT",
  "MEETING_SCHEDULED", "ON_HOLD", "MATCHED", "CLOSED",
];

export function CustomerFilters({
  counts,
  total,
}: {
  counts: Partial<Record<PipelineStatus, number>>;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeStatus = params.get("status");
  const needsAttention = params.get("attention") === "1";
  const [search, setSearch] = useState(params.get("q") ?? "");

  // Debounced so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (search === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (search) next.set("q", search);
      else next.delete("q");
      next.delete("page");
      router.replace(`${pathname}?${next}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, params, pathname, router]);

  function hrefWith(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    return `${pathname}?${next}`;
  }

  const chip = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
      active
        ? "border-primary bg-primary text-primary-fg"
        : "border-border bg-surface text-fg-muted hover:bg-surface-muted",
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or city"
          aria-label="Search clients"
          className="w-full rounded-md border border-border bg-surface py-2.5 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle"
        />
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        <Link href={hrefWith({ status: null })} className={chip(!activeStatus)}>
          All <span className="tnum opacity-70">{total}</span>
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={hrefWith({ status: s })} className={chip(activeStatus === s)}>
            {titleCase(s)} <span className="tnum opacity-70">{counts[s] ?? 0}</span>
          </Link>
        ))}
        <Link
          href={hrefWith({ attention: needsAttention ? null : "1" })}
          className={cn(
            chip(needsAttention),
            !needsAttention && "border-warning/40 text-warning-text",
          )}
        >
          Needs attention
        </Link>
      </div>
    </div>
  );
}
