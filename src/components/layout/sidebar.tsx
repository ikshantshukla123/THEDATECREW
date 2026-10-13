"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/customers", label: "Clients", Icon: Users },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto bg-ink px-3 py-5 lg:flex">
      <div className="mb-7 flex items-center gap-2.5 px-2">
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-md bg-primary font-display text-sm text-primary-fg"
        >
          T
        </span>
        <span className="text-sm font-semibold tracking-tight text-white">
          The Dating Company
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
