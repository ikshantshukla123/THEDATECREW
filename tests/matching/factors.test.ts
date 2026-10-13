import { describe, expect, it } from "vitest";
import { ageFactor } from "@/lib/matching/factors/age";
import { heightFactor } from "@/lib/matching/factors/height";
import { incomeFactor } from "@/lib/matching/factors/income";
import { kidsFactor } from "@/lib/matching/factors/kids";
import { educationFactor } from "@/lib/matching/factors/education";
import { relocationFactor } from "@/lib/matching/factors/relocation";
import { valuesFactor } from "@/lib/matching/factors/values";
import { lifestyleFactor } from "@/lib/matching/factors/lifestyle";
import { locationFactor } from "@/lib/matching/factors/location";
import { languageFactor } from "@/lib/matching/factors/language";
import { ctx, preference, profile, yearsAgo } from "./fixtures";

const male = (o = {}) => profile({ gender: "MALE", ...o });
const female = (o = {}) => profile({ gender: "FEMALE", ...o });

describe("age", () => {
  it("scores a male client's 1-5 year younger candidate at full marks", () => {
    for (const gap of [1, 3, 5]) {
      const r = ageFactor(male(), female({ dateOfBirth: yearsAgo(30 - gap) }), ctx());
      expect(r.score).toBe(1);
      expect(r.reason).toContain("younger");
    }
  });

  it("penalises an older candidate for a male client", () => {
    const r = ageFactor(male(), female({ dateOfBirth: yearsAgo(35) }), ctx());
    expect(r.score).toBeLessThan(0.3);
    expect(r.reason).toContain("older");
  });

  it("treats same age as neutral, not perfect, for a male client", () => {
    const r = ageFactor(male(), female({ dateOfBirth: yearsAgo(30) }), ctx());
    expect(r.score).toBeGreaterThan(0.5);
    expect(r.score).toBeLessThan(1);
    expect(r.reason).toBe("Same age");
  });

  it("is symmetric for a female client within four years", () => {
    const younger = ageFactor(female(), male({ dateOfBirth: yearsAgo(27) }), ctx());
    const older = ageFactor(female(), male({ dateOfBirth: yearsAgo(33) }), ctx());
    expect(younger.score).toBe(1);
    expect(older.score).toBe(1);
  });

  it("decays but never reaches zero for a large gap", () => {
    const r = ageFactor(male(), female({ dateOfBirth: yearsAgo(10) }), ctx());
    expect(r.score).toBeGreaterThan(0);
  });
});

describe("height", () => {
  it("rewards 5-20cm shorter for a male client", () => {
    const r = heightFactor(male({ heightCm: 180 }), female({ heightCm: 165 }), ctx());
    expect(r.score).toBe(1);
    expect(r.reason).toBe("15 cm shorter");
  });

  it("penalises a taller candidate for a male client", () => {
    const r = heightFactor(male({ heightCm: 170 }), female({ heightCm: 178 }), ctx());
    expect(r.score).toBeLessThan(0.2);
    expect(r.reason).toBe("8 cm taller");
  });

  it("rewards a taller candidate for a female client", () => {
    const r = heightFactor(female({ heightCm: 160 }), male({ heightCm: 175 }), ctx());
    expect(r.score).toBe(1);
    expect(r.reason).toBe("15 cm taller");
  });

  it("handles equal height without dividing by zero", () => {
    const r = heightFactor(male({ heightCm: 170 }), female({ heightCm: 170 }), ctx());
    expect(r.score).toBeGreaterThan(0);
    expect(r.reason).toBe("Same height");
  });
});

describe("income", () => {
  it("gives full marks when the candidate earns at or below the client", () => {
    expect(incomeFactor(male(), female({ annualIncome: 1_000_000 }), ctx()).score).toBe(1);
    expect(incomeFactor(male(), female({ annualIncome: 2_000_000 }), ctx()).score).toBe(1);
  });

  it("decays as the candidate out-earns the client", () => {
    const some = incomeFactor(male(), female({ annualIncome: 3_000_000 }), ctx()).score;
    const lots = incomeFactor(male(), female({ annualIncome: 8_000_000 }), ctx()).score;
    expect(some).toBeLessThan(1);
    expect(lots).toBeLessThan(some);
    expect(lots).toBeGreaterThanOrEqual(0.3);
  });
});

describe("kids", () => {
  it("is a zero when the answers are opposite", () => {
    const r = kidsFactor(male({ wantKids: "YES" }), female({ wantKids: "NO" }), ctx());
    expect(r.score).toBe(0);
  });

  it("is partial when one side is undecided", () => {
    expect(kidsFactor(male({ wantKids: "YES" }), female({ wantKids: "MAYBE" }), ctx()).score).toBe(0.6);
    expect(kidsFactor(male({ wantKids: "MAYBE" }), female({ wantKids: "NO" }), ctx()).score).toBe(0.6);
  });

  it("is full marks when both agree", () => {
    expect(kidsFactor(male({ wantKids: "YES" }), female({ wantKids: "YES" }), ctx()).score).toBe(1);
    expect(kidsFactor(male({ wantKids: "NO" }), female({ wantKids: "NO" }), ctx()).score).toBe(1);
  });
});

describe("education", () => {
  it("gives full marks at or above the client's level", () => {
    expect(educationFactor(female({ highestEducation: "MASTERS" }), male({ highestEducation: "MASTERS" }), ctx()).score).toBe(1);
    expect(educationFactor(female({ highestEducation: "BACHELORS" }), male({ highestEducation: "DOCTORATE" }), ctx()).score).toBe(1);
  });

  it("halves one level below and penalises two", () => {
    expect(educationFactor(female({ highestEducation: "MASTERS" }), male({ highestEducation: "BACHELORS" }), ctx()).score).toBe(0.5);
    expect(educationFactor(female({ highestEducation: "DOCTORATE" }), male({ highestEducation: "BACHELORS" }), ctx()).score).toBe(0.2);
  });
});

describe("relocation", () => {
  it("is full marks in the same city", () => {
    expect(relocationFactor(male({ city: "Pune" }), female({ city: "Pune" }), ctx()).score).toBe(1);
  });

  it("is full marks when the candidate will move", () => {
    const r = relocationFactor(male({ city: "Pune" }), female({ city: "Delhi", openToRelocate: "YES" }), ctx());
    expect(r.score).toBe(1);
    expect(r.reason).toContain("Pune");
  });

  it("is near zero when neither will move", () => {
    const r = relocationFactor(
      male({ city: "Pune", openToRelocate: "NO" }),
      female({ city: "Chennai", openToRelocate: "NO" }),
      ctx(),
    );
    expect(r.score).toBeLessThan(0.2);
  });
});

describe("values", () => {
  it("adds a bonus for the same family type", () => {
    const same = valuesFactor(male({ familyType: "NUCLEAR" }), female({ familyType: "NUCLEAR" }), ctx());
    const differentType = valuesFactor(male({ familyType: "NUCLEAR" }), female({ familyType: "JOINT" }), ctx());
    expect(same.score).toBeGreaterThanOrEqual(differentType.score);
    expect(same.reason).toContain("nuclear");
  });

  it("penalises traditional against liberal most", () => {
    const r = valuesFactor(male({ familyValues: "TRADITIONAL" }), female({ familyValues: "LIBERAL" }), ctx());
    expect(r.score).toBe(0.2);
  });
});

describe("lifestyle", () => {
  it("treats veg and jain as close, not identical", () => {
    const identical = lifestyleFactor(male({ diet: "VEG" }), female({ diet: "VEG" }), ctx()).score;
    const adjacent = lifestyleFactor(male({ diet: "VEG" }), female({ diet: "JAIN" }), ctx()).score;
    const opposed = lifestyleFactor(male({ diet: "VEG" }), female({ diet: "NON_VEG" }), ctx()).score;
    expect(identical).toBeGreaterThan(adjacent);
    expect(adjacent).toBeGreaterThan(opposed);
  });

  it("never returns a score outside 0..1", () => {
    const r = lifestyleFactor(
      male({ diet: "VEG", smoking: "NO", drinking: "NO" }),
      female({ diet: "NON_VEG", smoking: "YES", drinking: "YES" }),
      ctx(),
    );
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(1);
  });
});

describe("stated preferences", () => {
  const chennai = ctx(preference({ cities: ["Chennai"] }));

  it("ranks a listed city above the client's own when a list is given", () => {
    const client = female({ city: "Chennai" });
    const listed = locationFactor(client, male({ city: "Chennai" }), chennai).score;
    const off = locationFactor(
      client,
      male({ city: "Coimbatore", state: "Tamil Nadu", openToRelocate: "NO" }),
      chennai,
    ).score;
    expect(listed).toBe(1);
    expect(off).toBeLessThan(0.3);
  });

  it("gives a candidate credit for being willing to move to a listed city", () => {
    const client = female({ city: "Chennai" });
    const willing = locationFactor(client, male({ city: "Noida", openToRelocate: "YES" }), chennai).score;
    const rooted = locationFactor(client, male({ city: "Noida", openToRelocate: "NO" }), chennai).score;
    expect(willing).toBeGreaterThan(rooted);
  });

  it("falls back to the client's own city when no list is stated", () => {
    const client = female({ city: "Chennai", state: "Tamil Nadu" });
    expect(locationFactor(client, male({ city: "Chennai" }), ctx()).score).toBe(1);
  });

  it("scores a stated mother tongue above one the client merely shares", () => {
    const tamil = ctx(preference({ motherTongues: ["Tamil"] }));
    const client = female({ motherTongue: "Tamil", languages: ["Tamil", "Hindi"] });
    const asked = languageFactor(client, male({ motherTongue: "Tamil" }), tamil).score;
    const other = languageFactor(
      client,
      male({ motherTongue: "Hindi", languages: ["Hindi", "English"] }),
      tamil,
    ).score;
    expect(asked).toBe(1);
    expect(other).toBeLessThan(0.5);
  });

  it("penalises a diet the client ruled out", () => {
    const veg = ctx(preference({ diets: ["VEG", "JAIN"] }));
    const client = female({ diet: "NON_VEG" });
    const ok = lifestyleFactor(client, male({ diet: "VEG" }), veg).score;
    const not = lifestyleFactor(client, male({ diet: "NON_VEG" }), veg).score;
    expect(ok).toBeGreaterThan(not);
  });

  it("does not reward a candidate for merely matching the client's own plate", () => {
    const veg = ctx(preference({ diets: ["VEG"] }));
    const client = female({ diet: "NON_VEG", smoking: "NO", drinking: "NO" });
    const twin = lifestyleFactor(client, male({ diet: "NON_VEG", smoking: "NO", drinking: "NO" }), veg);
    expect(twin.score).toBeLessThan(1);
    expect(twin.reason).toContain("they wanted");
  });
});

describe("breakdown wording", () => {
  it("does not repeat the location reason under relocation", () => {
    const client = female({ city: "Surat" });
    const candidate = male({ city: "Surat" });
    const loc = locationFactor(client, candidate, ctx()).reason;
    const rel = relocationFactor(client, candidate, ctx()).reason;
    expect(rel).not.toBe(loc);
    expect(rel.toLowerCase()).toContain("move");
  });

  it("starts every values reason with a capital", () => {
    const pairs = [
      ["LIBERAL", "MODERATE"],
      ["TRADITIONAL", "LIBERAL"],
      ["MODERATE", "MODERATE"],
    ] as const;
    for (const [a, b] of pairs) {
      const r = valuesFactor(female({ familyValues: b }), male({ familyValues: a }), ctx());
      expect(r.reason[0]).toBe(r.reason[0].toUpperCase());
    }
  });
});
