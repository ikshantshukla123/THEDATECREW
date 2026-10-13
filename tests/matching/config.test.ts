import { describe, expect, it } from "vitest";
import { FACTORS, STRATEGIES } from "@/lib/matching/config";

describe("strategy configuration", () => {
  it.each(Object.entries(STRATEGIES))("%s weights sum to 100", (_name, strategy) => {
    const total = Object.values(strategy).reduce((sum, f) => sum + f.weight, 0);
    expect(total).toBe(100);
  });

  it.each(Object.entries(STRATEGIES))("%s only names factors that exist", (_name, strategy) => {
    for (const factor of Object.keys(strategy)) {
      expect(FACTORS).toHaveProperty(factor);
    }
  });

  it("every implemented factor is used by at least one strategy", () => {
    const used = new Set(Object.values(STRATEGIES).flatMap((s) => Object.keys(s)));
    for (const factor of Object.keys(FACTORS)) {
      expect(used).toContain(factor);
    }
  });
});
