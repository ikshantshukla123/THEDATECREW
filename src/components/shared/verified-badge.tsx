import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span title="ID and phone verified" className={className}>
      <BadgeCheck className="size-4 text-verified" aria-hidden />
      <span className="sr-only">Verified</span>
    </span>
  );
}
