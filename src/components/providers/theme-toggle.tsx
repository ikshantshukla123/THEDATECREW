"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Both icons render; `dark:` decides which is visible. Keeps server and
  // client markup identical, so there is nothing to hydrate around.
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-fg-muted transition-colors hover:bg-surface-muted"
    >
      <Sun className="size-4 dark:hidden" aria-hidden />
      <Moon className="hidden size-4 dark:block" aria-hidden />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
