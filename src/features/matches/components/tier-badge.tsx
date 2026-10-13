import type { MatchTier } from "@prisma/client";
import { Compass, Minus, Star, ThumbsUp } from "lucide-react";

const STYLES: Record<MatchTier, { label: string; className: string; Icon: typeof Star }> = {
  HIGH_POTENTIAL: { label: "High Potential", className: "bg-accent-soft text-accent-text", Icon: Star },
  GOOD: { label: "Good", className: "bg-primary-soft text-primary", Icon: ThumbsUp },
  WORTH_EXPLORING: { label: "Worth Exploring", className: "bg-surface-muted text-fg-muted", Icon: Compass },
  LOW: { label: "Low", className: "bg-surface-muted text-fg-subtle", Icon: Minus },
};

export function TierBadge({ tier }: { tier: MatchTier }) {
  const { label, className, Icon } = STYLES[tier];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
