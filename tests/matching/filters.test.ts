import { describe, expect, it } from "vitest";
import { buildCandidateFilter } from "@/lib/matching/filters";
import { NOW, preference, profile, yearsAgo } from "./fixtures";

const male = (o = {}) => profile({ gender: "MALE", ...o });
const build = (client = male(), pref = preference(), exclude: string[] = []) =>
  buildCandidateFilter(client, pref, exclude, NOW);

describe("hard filters", () => {
  it("only ever looks at verified, opposite-gender non-clients", () => {
    const w = build();
    expect(w.isClient).toBe(false);
    expect(w.isVerified).toBe(true);
    expect(w.gender).toBe("FEMALE");
    expect(build(profile({ gender: "FEMALE" })).gender).toBe("MALE");
  });

  it("defaults to never-married when the client has saved no preferences", () => {
    const w = buildCandidateFilter(male(), null, [], NOW);
    expect(w.maritalStatus).toBe("NEVER_MARRIED");
  });

  it("still applies the children dealbreaker without a preference row", () => {
    expect(buildCandidateFilter(male({ wantKids: "NO" }), null, [], NOW).wantKids)
      .toEqual({ not: "YES" });
  });

  it("admits a second marriage but not someone mid-divorce", () => {
    expect(build(male(), preference({ acceptDivorced: true })).maritalStatus)
      .toEqual({ not: "AWAITING_DIVORCE" });
    expect(build(male(), preference({ acceptDivorced: false })).maritalStatus)
      .toBe("NEVER_MARRIED");
  });

  it("turns an age range into a date-of-birth window", () => {
    const w = build(male(), preference({ minAge: 25, maxAge: 30 }));
    const dob = w.dateOfBirth as { gte: Date; lte: Date };
    expect(dob.lte.getTime()).toBe(yearsAgo(25).getTime());
    expect(dob.gte.getTime()).toBe(yearsAgo(31).getTime());
  });

  it("ignores the caste list when caste is no bar", () => {
    const castes = ["Deshastha Brahmin"];
    expect(build(male(), preference({ castes, casteNoBar: true })).caste).toBeUndefined();
    expect(build(male(), preference({ castes, casteNoBar: false })).caste).toEqual({ in: castes });
  });

  it("matches manglik with manglik only when the client asked", () => {
    const client = male({ manglik: "YES" });
    expect(build(client, preference({ manglikMatters: false })).manglik).toBeUndefined();
    expect(build(client, preference({ manglikMatters: true })).manglik)
      .toEqual({ in: ["YES", "PARTIAL"] });
  });

  it("keeps a non-manglik client away from a manglik chart", () => {
    expect(build(male({ manglik: "NO" }), preference({ manglikMatters: true })).manglik)
      .toEqual({ in: ["NO", "PARTIAL"] });
  });

  it("asserts nothing when the client's own chart is unknown", () => {
    expect(build(male({ manglik: "DONT_KNOW" }), preference({ manglikMatters: true })).manglik)
      .toBeUndefined();
  });

  it("rules out a same-gotra match between two Hindus", () => {
    const client = male({ religion: "Hindu", gotra: "Bharadwaj" });
    expect(build(client).NOT).toEqual({ religion: "Hindu", gotra: "Bharadwaj" });
  });

  it("does not apply the gotra rule outside Hinduism or without a gotra", () => {
    expect(build(male({ religion: "Sikh", gotra: "Bharadwaj" })).NOT).toBeUndefined();
    expect(build(male({ religion: "Hindu", gotra: null })).NOT).toBeUndefined();
  });

  it("applies the gotra rule even with no saved preferences", () => {
    const client = male({ religion: "Hindu", gotra: "Kashyap" });
    expect(buildCandidateFilter(client, null, [], NOW).NOT)
      .toEqual({ religion: "Hindu", gotra: "Kashyap" });
  });

  it("leaves soft preferences to the factors, not the query", () => {
    const w = build(male(), preference({ cities: ["Chennai"], diets: ["VEG"], minIncome: 5_000_000 }));
    expect(w.city).toBeUndefined();
    expect(w.diet).toBeUndefined();
    expect(w.annualIncome).toBeUndefined();
  });
});
