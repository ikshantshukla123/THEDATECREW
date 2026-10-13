import { CheckCircle2, Star, ThumbsUp, Compass, AlertTriangle } from "lucide-react";
import { ThemeToggle } from "@/components/providers/theme-toggle";

export const metadata = { title: "Design tokens" };

const SWATCHES = [
  { name: "primary", cls: "bg-primary", note: "Send Match, active nav" },
  { name: "primary-soft", cls: "bg-primary-soft", note: "selected tile" },
  { name: "ink", cls: "bg-ink", note: "sidebar" },
  { name: "accent", cls: "bg-accent", note: "fill only" },
  { name: "accent-soft", cls: "bg-accent-soft", note: "gold tint" },
  { name: "verified", cls: "bg-verified", note: "badge, focus ring" },
  { name: "success", cls: "bg-success", note: "accepted" },
  { name: "warning", cls: "bg-warning", note: "fill only" },
  { name: "danger", cls: "bg-danger", note: "declined" },
];

const TIERS = [
  { label: "High Potential", Icon: Star, fill: "bg-accent-soft", text: "text-accent-text" },
  { label: "Good", Icon: ThumbsUp, fill: "bg-primary-soft", text: "text-primary" },
  { label: "Worth Exploring", Icon: Compass, fill: "bg-surface-muted", text: "text-fg-muted" },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1320px] px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] leading-9 text-fg">
            Matchmaker Dashboard
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Design tokens — UI-UX.md §3.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold text-fg">Palette</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SWATCHES.map((s) => (
            <div
              key={s.name}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              <div className={`h-14 w-full ${s.cls}`} />
              <div className="px-3 py-2">
                <p className="text-[13px] font-medium text-fg">{s.name}</p>
                <p className="text-xs text-fg-subtle">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold text-fg">Tier badges</h2>
        <div className="flex flex-wrap gap-3">
          {TIERS.map(({ label, Icon, fill, text }) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${fill} ${text}`}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </span>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-warning-text">
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
          She prefers to stay in Pune
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold text-fg">Type scale</h2>
        <div className="space-y-2 rounded-lg border border-border bg-surface p-5">
          <p className="font-display text-[28px] leading-9 text-fg">
            Ananya Deshpande{" "}
            <CheckCircle2 className="inline size-5 text-verified" aria-label="Verified" />
          </p>
          <p className="text-2xl font-semibold text-fg">Your clients</p>
          <p className="text-base text-fg">Body — 5′ 4″ · Product Manager · Pune</p>
          <p className="text-[13px] font-medium text-fg-muted">Label — Annual income</p>
          <p className="tnum text-base text-fg">₹18 L / year · 86 / 100</p>
          <p className="text-xs text-fg-subtle">Caption — updated 12 Oct 2026</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-fg">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <button className="min-h-10 rounded-full bg-primary px-[22px] font-semibold text-primary-fg transition-colors hover:bg-primary-hover active:scale-[0.98]">
            Send Match
          </button>
          <button className="min-h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium text-fg transition-colors hover:bg-surface-muted">
            Save for later
          </button>
          <button className="min-h-10 rounded-md px-4 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-muted">
            Skip
          </button>
        </div>
      </section>
    </main>
  );
}
