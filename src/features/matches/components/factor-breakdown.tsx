import { titleCase } from "@/lib/format";

type Row = { factor: string; weight: number; score: number; reason: string };

/** Where the explainability actually lands — every factor, its weight, its reason. */
export function FactorBreakdown({ rows }: { rows: Row[] }) {
  return (
    <details className="group mt-3 border-t border-border pt-3">
      <summary className="cursor-pointer list-none text-[13px] font-medium text-primary hover:underline">
        See score breakdown
        <span className="ml-1 inline-block transition-transform group-open:rotate-90" aria-hidden>›</span>
      </summary>
      <ul className="mt-3 flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.factor} className="grid grid-cols-[88px_1fr_34px] items-center gap-2.5">
            <span className="truncate text-xs text-fg-muted" title={`weight ${row.weight}`}>
              {titleCase(row.factor)}
            </span>
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.round(row.score * 100)}%` }}
              />
            </span>
            <span className="tnum text-right text-xs text-fg-subtle">
              {Math.round(row.score * 100)}
            </span>
            <span className="col-span-3 -mt-1 text-xs text-fg-subtle">{row.reason}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
