import type { Factor } from "../types";

/** A hard disagreement here is the most common late-stage dealbreaker. */
export const kidsFactor: Factor = (client, candidate) => {
  if (client.wantKids === candidate.wantKids) {
    if (client.wantKids === "YES") return { score: 1, reason: "Both want children" };
    if (client.wantKids === "NO") return { score: 1, reason: "Neither wants children" };
    return { score: 0.8, reason: "Both undecided about children" };
  }
  if (client.wantKids === "MAYBE" || candidate.wantKids === "MAYBE") {
    return { score: 0.6, reason: "One is undecided about children" };
  }
  return { score: 0, reason: "Opposite views on children" };
};
