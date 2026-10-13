import type { Diet, Habit } from "@prisma/client";
import type { Factor } from "../types";

/** Vegetarian-leaning diets are mutually compatible; non-veg is the split. */
const VEG: Diet[] = ["VEG", "JAIN", "VEGAN"];

function dietScore(a: Diet, b: Diet): number {
  if (a === b) return 1;
  const aVeg = VEG.includes(a);
  const bVeg = VEG.includes(b);
  if (aVeg && bVeg) return 0.85;
  if (a === "EGGETARIAN" || b === "EGGETARIAN") return aVeg || bVeg ? 0.6 : 0.8;
  return 0.3;
}

const HABIT_RANK: Record<Habit, number> = { NO: 0, OCCASIONALLY: 1, YES: 2 };

function habitScore(a: Habit, b: Habit): number {
  const distance = Math.abs(HABIT_RANK[a] - HABIT_RANK[b]);
  return distance === 0 ? 1 : distance === 1 ? 0.6 : 0.2;
}

export const lifestyleFactor: Factor = (client, candidate, ctx) => {
  // A stated diet list is the bar to clear; otherwise fall back to matching
  // the client's own plate.
  const wanted = ctx.preference?.diets ?? [];
  const diet =
    wanted.length > 0
      ? wanted.includes(candidate.diet)
        ? 1
        : Math.max(...wanted.map((d) => dietScore(d, candidate.diet))) * 0.8
      : dietScore(client.diet, candidate.diet);
  const smoking = habitScore(client.smoking, candidate.smoking);
  const drinking = habitScore(client.drinking, candidate.drinking);
  const score = (diet + smoking + drinking) / 3;

  const label = (d: Diet) => d.toLowerCase().replace("_", "-");
  const parts: string[] = [];
  if (wanted.length > 0) {
    parts.push(
      wanted.includes(candidate.diet)
        ? `${label(candidate.diet)}, as asked`
        : `${label(candidate.diet)} against the ${wanted.map(label).join("/")} they wanted`,
    );
  } else if (client.diet === candidate.diet) {
    parts.push(`both ${label(client.diet)}`);
  } else {
    parts.push(`${label(candidate.diet)} against ${label(client.diet)}`);
  }
  if (client.smoking === "NO" && candidate.smoking === "NO") parts.push("neither smokes");
  else if (candidate.smoking === "YES" && client.smoking === "NO") {
    parts.push(`${candidate.gender === "MALE" ? "he" : "she"} smokes, the client does not`);
  }

  return { score, reason: parts.join(", ").replace(/^./, (c) => c.toUpperCase()) };
};
