import { createHash } from "node:crypto";
import { faker } from "@faker-js/faker";
import type { MatchStatus, MatchTier, Prisma } from "@prisma/client";

type Party = {
  id: string;
  firstName: string;
  city: string;
  religion: string;
  motherTongue: string;
  diet: string;
  familyValues: string;
  wantKids: string;
  openToRelocate: string;
  annualIncome: number;
  heightCm: number;
  dateOfBirth: Date;
  highestEducation: string;
  designation: string | null;
};

const yearsOld = (d: Date) => Math.floor((Date.now() - d.getTime()) / 31_557_600_000);
const lakhs = (n: number) => `₹${Math.round(n / 100_000)}L`;

/** Mirrors the shape lib/matching will produce: score, weight, reason per factor. */
function breakdown(client: Party, candidate: Party) {
  const ageGap = yearsOld(client.dateOfBirth) - yearsOld(candidate.dateOfBirth);
  const heightGap = client.heightCm - candidate.heightCm;

  const rows = [
    {
      factor: "age",
      weight: 20,
      score: Math.max(0.2, 1 - Math.abs(Math.abs(ageGap) - 3) / 10),
      reason:
        ageGap === 0
          ? "Same age"
          : `${Math.abs(ageGap)} ${Math.abs(ageGap) === 1 ? "year" : "years"} ${ageGap > 0 ? "younger" : "older"}`,
    },
    {
      factor: "kids",
      weight: 18,
      score: client.wantKids === candidate.wantKids ? 1 : client.wantKids === "MAYBE" || candidate.wantKids === "MAYBE" ? 0.6 : 0,
      reason:
        client.wantKids === candidate.wantKids
          ? client.wantKids === "YES" ? "Both want children" : "Aligned on children"
          : "Differing views on children",
    },
    {
      factor: "values",
      weight: 10,
      score: client.familyValues === candidate.familyValues ? 1 : 0.6,
      reason:
        client.familyValues === candidate.familyValues
          ? `Both from ${client.familyValues.toLowerCase()} families`
          : "Different family outlooks",
    },
    {
      factor: "lifestyle",
      weight: 8,
      score: client.diet === candidate.diet ? 1 : 0.5,
      reason: client.diet === candidate.diet ? `Both ${client.diet.toLowerCase().replace("_", "-")}` : "Different diets",
    },
    {
      factor: "language",
      weight: 4,
      score: client.motherTongue === candidate.motherTongue ? 1 : 0.4,
      reason:
        client.motherTongue === candidate.motherTongue
          ? `Both speak ${client.motherTongue}`
          : `${client.motherTongue} and ${candidate.motherTongue}`,
    },
    {
      factor: "location",
      weight: 4,
      score: client.city === candidate.city ? 1 : candidate.openToRelocate === "YES" ? 0.7 : 0.3,
      reason:
        client.city === candidate.city
          ? `Both in ${client.city}`
          : candidate.openToRelocate === "YES"
            ? `Open to relocating to ${client.city}`
            : `${candidate.city} and ${client.city}`,
    },
    {
      factor: "height",
      weight: 12,
      score: heightGap >= 5 && heightGap <= 20 ? 1 : heightGap > 0 ? 0.7 : 0.3,
      reason: heightGap > 0 ? `${Math.abs(heightGap)} cm shorter` : `${Math.abs(heightGap)} cm taller`,
    },
    {
      factor: "income",
      weight: 14,
      score: candidate.annualIncome <= client.annualIncome ? 1 : 0.6,
      reason: `Earns ${lakhs(candidate.annualIncome)} against ${lakhs(client.annualIncome)}`,
    },
  ];

  const total = rows.reduce((s, r) => s + r.weight, 0);
  const ruleScore = Math.round(
    (100 * rows.reduce((s, r) => s + r.weight * r.score, 0)) / total,
  );
  return { rows, ruleScore };
}

function tierFor(score: number): MatchTier {
  if (score >= 80) return "HIGH_POTENTIAL";
  if (score >= 65) return "GOOD";
  if (score >= 50) return "WORTH_EXPLORING";
  return "LOW";
}

function concernFor(client: Party, candidate: Party): string | null {
  if (client.city !== candidate.city && candidate.openToRelocate === "NO") {
    return `${candidate.firstName} prefers to stay in ${candidate.city}`;
  }
  if (client.wantKids !== candidate.wantKids) {
    return "They have not aligned on children yet";
  }
  if (client.religion !== candidate.religion) {
    return `Different communities — ${candidate.religion} and ${client.religion}`;
  }
  if (candidate.annualIncome > client.annualIncome * 1.5) {
    return "Noticeable income gap worth discussing early";
  }
  return null;
}

export function makeMatch(
  client: Party,
  candidate: Party,
  status: MatchStatus,
  sentAt: Date | null,
  model: string,
): Prisma.MatchCreateManyInput {
  const { rows, ruleScore } = breakdown(client, candidate);
  const tier = tierFor(ruleScore);

  // Top two scoring factors become the AI's stated reasons.
  const reasons = [...rows]
    .sort((a, b) => b.weight * b.score - a.weight * a.score)
    .slice(0, 2)
    .map((r) => r.reason);

  const pairHash = createHash("sha256")
    .update(`${client.id}:${candidate.id}:${ruleScore}`)
    .digest("hex");

  const sent = sentAt !== null;
  return {
    clientId: client.id,
    candidateId: candidate.id,
    ruleScore,
    ruleBreakdown: rows,
    aiTier: tier,
    aiReasons: reasons,
    aiConcern: concernFor(client, candidate),
    aiModel: model,
    pairHash,
    status,
    sentAt,
    introSubject: sent
      ? `A profile we think you'll like, ${client.firstName}`
      : null,
    introBody: sent
      ? `Hi ${client.firstName},\n\nWe came across ${candidate.firstName}, ${yearsOld(candidate.dateOfBirth)}, ` +
        `a ${candidate.designation ?? "professional"} based in ${candidate.city}. ` +
        `${reasons[0]}, and ${reasons[1]?.toLowerCase() ?? "the match looks promising"}. ` +
        `We thought the two of you might get along.\n\n` +
        `Would you like me to set up a call?\n\nWarmly,\nThe Dating Company`
      : null,
    createdAt: sentAt ?? faker.date.recent({ days: 20 }),
  };
}
