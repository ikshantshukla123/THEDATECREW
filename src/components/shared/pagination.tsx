import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** 1 … 4 5 6 … 12 — always first, last, current and its neighbours. */
function pageItems(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const out: Array<number | "gap"> = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) out.push("gap");
    out.push(page);
    previous = page;
  }
  return out;
}

export function Pagination({
  page, totalPages, total, perPage, buildHref, noun = "clients",
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  buildHref: (page: number) => string;
  noun?: string;
}) {
  if (totalPages <= 1) return null;

  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  const box =
    "inline-flex size-9 items-center justify-center rounded-md border border-border text-sm transition-colors";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-[13px] text-fg-muted">
        Showing <span className="tnum font-medium text-fg">{first}–{last}</span> of{" "}
        <span className="tnum font-medium text-fg">{total}</span> {noun}
      </p>

      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={buildHref(page - 1)} aria-label="Previous page" className={cn(box, "bg-surface text-fg hover:bg-surface-muted")}>
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          <span aria-disabled className={cn(box, "text-fg-subtle opacity-40")}>
            <ChevronLeft className="size-4" aria-hidden />
          </span>
        )}

        {pageItems(page, totalPages).map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-fg-subtle" aria-hidden>
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              className={cn(box, "tnum border-primary bg-primary font-semibold text-primary-fg")}
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={buildHref(item)}
              aria-label={`Page ${item}`}
              className={cn(box, "tnum bg-surface text-fg hover:bg-surface-muted")}
            >
              {item}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link href={buildHref(page + 1)} aria-label="Next page" className={cn(box, "bg-surface text-fg hover:bg-surface-muted")}>
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span aria-disabled className={cn(box, "text-fg-subtle opacity-40")}>
            <ChevronRight className="size-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
