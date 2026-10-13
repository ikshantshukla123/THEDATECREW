import type { MatchTier } from "@prisma/client";

const STROKE: Record<MatchTier, string> = {
  HIGH_POTENTIAL: "stroke-accent",
  GOOD: "stroke-primary",
  WORTH_EXPLORING: "stroke-verified",
  LOW: "stroke-fg-subtle",
};

/** 56px: smaller leaves no room for two digits plus a readable stroke. */
export function ScoreRing({ score, tier }: { score: number; tier: MatchTier }) {
  const size = 56;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`Match score ${score} out of 100`}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={4} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={STROKE[tier]}
        />
      </svg>
      <span className="tnum absolute text-sm font-semibold text-fg">{score}</span>
    </span>
  );
}
