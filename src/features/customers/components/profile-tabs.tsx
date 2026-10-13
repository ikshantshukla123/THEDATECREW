"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "biodata", label: "Biodata" },
  { slug: "matches", label: "Matches" },
  { slug: "notes", label: "Notes" },
  { slug: "activity", label: "Activity" },
];

export function ProfileTabs({ profileId }: { profileId: string }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-5 overflow-x-auto border-b border-border px-5 lg:mx-0 lg:px-0">
      <ul className="flex gap-1">
        {TABS.map(({ slug, label }) => {
          const href = `/customers/${profileId}/${slug}`;
          const active = pathname === href;
          return (
            <li key={slug}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-primary text-fg"
                    : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
