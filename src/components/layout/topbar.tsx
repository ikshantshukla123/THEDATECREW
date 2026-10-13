import { ThemeToggle } from "@/components/providers/theme-toggle";
import { logoutAction } from "@/features/auth/actions";
import type { Session } from "@/lib/auth/session";

export function Topbar({ session }: { session: Session }) {
  const initials = session.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-end gap-3 border-b border-border bg-surface px-5">
      <ThemeToggle />

      <div className="flex items-center gap-2.5 border-l border-border pl-3">
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
        >
          {initials}
        </span>
        <span className="hidden text-sm font-medium text-fg sm:block">{session.name}</span>
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
