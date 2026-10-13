import { describe, expect, it } from "vitest";
import { rankCandidates, scorePair, strategyFor } from "@/lib/matching";
import { clampTier, tierForScore } from "@/lib/matching/tier";
import { ctx, preference, profile, yearsAgo } from "./fixtures";

describe("scorePair", () => {
  it("returns 0..100 and a breakdown row per weighted factor", () => {
    const client = profile({ gender: "MALE" });
    const candidate = profile({ id: "c1", gender: "FEMALE", dateOfBirth: yearsAgo(27) });
    const { ruleScore, breakdown } = scorePair(client, candidate, ctx());

    expect(ruleScore).toBeGreaterThanOrEqual(0);
    expect(ruleScore).toBeLessThanOrEqual(100);
    expect(breakdown).toHaveLength(9);
    for (const row of breakdown) {
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(1);
      expect(row.reason).not.toBe("");
    }
  });

  it("sorts the breakdown by contribution, strongest first", () => {
    const { breakdown } = scorePair(
      profile({ gender: "MALE" }),
      profile({ id: "c1", gender: "FEMALE", dateOfBirth: yearsAgo(27) }),
      ctx(),
    );
    const contributions = breakdown.map((r) => r.weight * r.score);
    expect([...contributions].sort((a, b) => b - a)).toEqual(contributions);
  });

  it("scores an ideal candidate far above a poor one", () => {
    const client = profile({ gender: "MALE", heightCm: 180, annualIncome: 2_500_000 });
    const ideal = profile({
      id: "ideal", gender: "FEMALE", dateOfBirth: yearsAgo(27), heightCm: 165,
      annualIncome: 1_500_000, city: "Pune", wantKids: "YES",
      familyValues: "MODERATE", diet: "VEG", motherTongue: "Marathi",
    });
    const poor = profile({
      id: "poor", gender: "FEMALE", dateOfBirth: yearsAgo(36), heightCm: 183,
      annualIncome: 9_000_000, city: "Kolkata", openToRelocate: "NO",
      wantKids: "NO", familyValues: "LIBERAL", diet: "NON_VEG",
      motherTongue: "Bengali", languages: ["Bengali"],
    });

    const good = scorePair(client, ideal, ctx()).ruleScore;
    const bad = scorePair(client, poor, ctx()).ruleScore;
    expect(good).toBeGreaterThan(80);
    expect(bad).toBeLessThan(40);
  });

  it("is deterministic", () => {
    const client = profile({ gender: "MALE" });
    const candidate = profile({ id: "c1", gender: "FEMALE" });
    const a = scorePair(client, candidate, ctx());
    const b = scorePair(client, candidate, ctx());
    expect(a).toEqual(b);
  });
});

describe("gender strategies", () => {
  it("uses income for a male client and career for a female client", () => {
    const maleFactors = Object.keys(strategyFor(profile({ gender: "MALE" }), null));
    const femaleFactors = Object.keys(strategyFor(profile({ gender: "FEMALE" }), null));

    expect(maleFactors).toContain("income");
    expect(maleFactors).toContain("height");
    expect(maleFactors).not.toContain("education");

    expect(femaleFactors).toContain("career");
    expect(femaleFactors).toContain("education");
    expect(femaleFactors).not.toContain("income");
  });

  it("weights age far more heavily for a male client", () => {
    const male = strategyFor(profile({ gender: "MALE" }), null);
    const female = strategyFor(profile({ gender: "FEMALE" }), null);
    expect(male.age!.weight).toBeGreaterThan(female.age!.weight);
  });
});

describe("weight overrides", () => {
  it("zeroing income removes it from the breakdown", () => {
    const client = profile({ gender: "MALE" });
    const candidate = profile({ id: "c1", gender: "FEMALE", annualIncome: 9_000_000 });

    const before = scorePair(client, candidate, ctx(preference()));
    const after = scorePair(
      client, candidate,
      ctx(preference({ weightOverrides: { income: 0 } })),
    );

    expect(before.breakdown.some((r) => r.factor === "income")).toBe(true);
    expect(after.breakdown.some((r) => r.factor === "income")).toBe(false);
    // Dropping a factor the candidate scored badly on must raise the total.
    expect(after.ruleScore).toBeGreaterThan(before.ruleScore);
  });

  it("changes ranking order", () => {
    // Tuned so the two factors pull against each other: age (weight 20)
    // favours "rich", income (weight 14) favours "poor". Everything else
    // is identical, so dropping income must flip the winner.
    const client = profile({ gender: "MALE", dateOfBirth: yearsAgo(30), annualIncome: 2_000_000 });
    const richer = profile({ id: "rich", gender: "FEMALE", dateOfBirth: yearsAgo(27), annualIncome: 9_000_000 });
    const poorer = profile({ id: "poor", gender: "FEMALE", dateOfBirth: yearsAgo(30), annualIncome: 800_000 });

    const withIncome = rankCandidates(client, [richer, poorer], ctx(preference()));
    const without = rankCandidates(client, [richer, poorer], ctx(preference({ weightOverrides: { income: 0 } })));

    expect(withIncome[0].candidateId).toBe("poor");
    expect(without[0].candidateId).toBe("rich");
  });

  it("ignores malformed overrides instead of throwing", () => {
    const client = profile({ gender: "MALE" });
    const candidate = profile({ id: "c1", gender: "FEMALE" });
    for (const bad of ["nonsense", 42, { notAFactor: 5 }, { income: "high" }, []]) {
      expect(() => scorePair(client, candidate, ctx(preference({ weightOverrides: bad })))).not.toThrow();
    }
  });

  it("cannot introduce a factor the strategy does not use", () => {
    const client = profile({ gender: "MALE" });
    const candidate = profile({ id: "c1", gender: "FEMALE" });
    const { breakdown } = scorePair(
      client, candidate,
      ctx(preference({ weightOverrides: { education: 50 } })),
    );
    expect(breakdown.some((r) => r.factor === "education")).toBe(false);
  });
});

describe("rankCandidates", () => {
  it("orders by score descending", () => {
    const client = profile({ gender: "MALE" });
    const candidates = [25, 30, 35, 40].map((age, i) =>
      profile({ id: `c${i}`, gender: "FEMALE", dateOfBirth: yearsAgo(age) }),
    );
    const ranked = rankCandidates(client, candidates, ctx());
    const scores = ranked.map((r) => r.ruleScore);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("breaks ties deterministically by id", () => {
    const client = profile({ gender: "MALE" });
    const a = profile({ id: "aaa", gender: "FEMALE", dateOfBirth: yearsAgo(27) });
    const b = profile({ id: "bbb", gender: "FEMALE", dateOfBirth: yearsAgo(27) });
    expect(rankCandidates(client, [b, a], ctx())[0].candidateId).toBe("aaa");
  });

  it("returns an empty array for no candidates", () => {
    expect(rankCandidates(profile(), [], ctx())).toEqual([]);
  });
});

describe("tierForScore", () => {
  it.each([
    [95, "HIGH_POTENTIAL"], [88, "HIGH_POTENTIAL"],
    [87, "GOOD"], [76, "GOOD"],
    [75, "WORTH_EXPLORING"], [62, "WORTH_EXPLORING"],
    [61, "LOW"], [0, "LOW"],
  ])("maps %i to %s", (score, tier) => {
    expect(tierForScore(score)).toBe(tier);
  });

  it("discriminates across a realistic post-filter spread", () => {
    // Survivors cluster high; the tiers must still separate them.
    const spread = [91, 85, 80, 74, 68, 60].map(tierForScore);
    expect(new Set(spread).size).toBeGreaterThanOrEqual(3);
  });
});

describe("clampTier", () => {
  it("keeps the model's tier when it is within one band", () => {
    // 86 is GOOD by the rules; WORTH_EXPLORING is one band down.
    expect(clampTier("WORTH_EXPLORING", 86)).toBe("WORTH_EXPLORING");
    expect(clampTier("HIGH_POTENTIAL", 86)).toBe("HIGH_POTENTIAL");
  });

  it("will not let the label contradict the score", () => {
    // The case that surfaced this: a 93 labelled LOW, ranked below an 86.
    expect(clampTier("LOW", 93)).toBe("GOOD");
    expect(clampTier("HIGH_POTENTIAL", 40)).toBe("WORTH_EXPLORING");
  });

  it("leaves an agreeing tier untouched", () => {
    expect(clampTier("HIGH_POTENTIAL", 93)).toBe("HIGH_POTENTIAL");
    expect(clampTier("LOW", 40)).toBe("LOW");
  });

  it("never ranks a higher score below a lower one by more than a band", () => {
    const better = clampTier("LOW", 93);
    const worse = clampTier("WORTH_EXPLORING", 86);
    const order = ["HIGH_POTENTIAL", "GOOD", "WORTH_EXPLORING", "LOW"];
    expect(order.indexOf(better)).toBeLessThanOrEqual(order.indexOf(worse));
  });
});
