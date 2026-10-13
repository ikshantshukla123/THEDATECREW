import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";
import type { GeneratedProfile } from "./profile.factory";

/**
 * Preferences are derived from the client, not rolled independently — a
 * 34-year-old does not ask for a 22-year-old, and a traditional family is
 * more likely to set a caste filter.
 */
export function makePreference(
  client: GeneratedProfile,
): Omit<Prisma.PartnerPreferenceCreateInput, "profile"> {
  const { age } = client._meta;
  const male = client.gender === "MALE";

  // Men typically look younger, women same-age to slightly older.
  const minAge = male ? Math.max(21, age - 7) : Math.max(22, age - 2);
  const maxAge = male ? age + 2 : age + 7;

  const heightCm = client.heightCm;
  const minHeightCm = male ? heightCm - 25 : heightCm - 2;
  const maxHeightCm = male ? heightCm - 1 : heightCm + 22;

  const traditional = client.familyValues === "TRADITIONAL";
  const casteNoBar = traditional
    ? faker.datatype.boolean({ probability: 0.25 })
    : faker.datatype.boolean({ probability: 0.8 });

  // Most clients stay within their religion; a minority leave it open.
  const religions = faker.datatype.boolean({ probability: traditional ? 0.95 : 0.7 })
    ? [client.religion]
    : [];

  return {
    minAge,
    maxAge,
    minHeightCm,
    maxHeightCm,
    // Women more often set an income floor; men rarely do.
    minIncome: !male && faker.datatype.boolean({ probability: 0.6 })
      ? Math.round((client.annualIncome * 0.8) / 100_000) * 100_000
      : null,
    religions,
    castes: casteNoBar || !client.caste ? [] : [client.caste],
    casteNoBar,
    motherTongues: faker.datatype.boolean({ probability: 0.45 }) ? [client.motherTongue] : [],
    cities: faker.datatype.boolean({ probability: 0.35 }) ? [client.city] : [],
    diets: client.diet === "VEG" || client.diet === "JAIN"
      ? faker.datatype.boolean({ probability: 0.7 }) ? ["VEG", "JAIN"] : []
      : [],
    acceptDivorced:
      client.maritalStatus !== "NEVER_MARRIED" ||
      faker.datatype.boolean({ probability: 0.3 }),
    manglikMatters:
      client.religion === "Hindu" && faker.datatype.boolean({ probability: 0.35 }),
    // Left null for most; a few clients get an explicit override so the
    // weight-override path has real data behind it.
    weightOverrides: faker.datatype.boolean({ probability: 0.15 })
      ? { income: 0 }
      : undefined,
  };
}
