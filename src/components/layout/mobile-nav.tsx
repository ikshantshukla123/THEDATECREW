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

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="z-10 flex shrink-0 border-t border-border bg-surface lg:hidden">
      {NAV.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            // 44px minimum touch target.
            className={cn(
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
              active ? "text-primary" : "text-fg-subtle",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
