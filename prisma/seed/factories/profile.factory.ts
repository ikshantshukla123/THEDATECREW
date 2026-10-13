import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";
import { CITIES, type City } from "../data/cities";
import {
  CASTES_BY_RELIGION, GOTRAS, LANGUAGE_POOL,
  MOTHER_TONGUE_BY_REGION, RELIGION_WEIGHTS_BY_REGION,
} from "../data/communities";
import { COLLEGES, type CollegeTier } from "../data/colleges";
import { PARENT_OCCUPATIONS, PROFESSIONS, professionWeight } from "../data/companies";
import {
  FEMALE_FIRST_NAMES, MALE_FIRST_NAMES, NAMES_BY_RELIGION, SURNAMES_BY_REGION,
} from "../data/names";

type Gender = "MALE" | "FEMALE";

function weighted<T>(items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, i) => sum + weight(i), 0);
  let roll = faker.number.float({ min: 0, max: total });
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/** Height in cm, normally distributed around gendered means. */
function heightCm(gender: Gender): number {
  const mean = gender === "MALE" ? 173 : 160;
  const raw = faker.number.float({ min: -1, max: 1 }) + faker.number.float({ min: -1, max: 1 });
  return Math.round(mean + raw * 6);
}

function collegeTier(): CollegeTier {
  return weighted(["ELITE", "STRONG", "REGIONAL"] as const, (t) =>
    t === "ELITE" ? 1 : t === "STRONG" ? 3 : 4,
  );
}

export type GeneratedProfile = Omit<Prisma.ProfileCreateInput, "matchmaker"> & {
  /** Kept out of the DB row; the preference factory reads it. */
  _meta: { region: City["region"]; age: number; professionField: string };
};

export function makeProfile(gender: Gender, opts: { isClient: boolean }): GeneratedProfile {
  const city = weighted(CITIES, (c) => c.weight);
  const region = city.region;
  const religionWeights = RELIGION_WEIGHTS_BY_REGION[region];
  const religion = weighted(Object.keys(religionWeights), (r) => religionWeights[r]);

  // Names: Muslim and Christian profiles use their own pools; everyone else
  // takes a region-appropriate surname.
  const special = NAMES_BY_RELIGION[religion];
  const firstName = special
    ? faker.helpers.arrayElement(gender === "MALE" ? special.male : special.female)
    : faker.helpers.arrayElement(gender === "MALE" ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES);
  const lastName = special
    ? faker.helpers.arrayElement(special.surnames)
    : faker.helpers.arrayElement(SURNAMES_BY_REGION[region]);

  // Women in this client base skew slightly younger than men.
  const age = gender === "MALE"
    ? faker.number.int({ min: 26, max: 38 })
    : faker.number.int({ min: 24, max: 34 });
  const dateOfBirth = faker.date.birthdate({ mode: "age", min: age, max: age });

  const tier = collegeTier();
  const profession = weighted(PROFESSIONS, (p) => professionWeight(p, tier));

  // Degree comes from the profession, not a generic pool keyed only on level.
  const levels = Object.keys(profession.degrees) as Array<keyof typeof profession.degrees>;
  const highestEducation = faker.helpers.arrayElement(levels);
  const degree = faker.helpers.arrayElement(profession.degrees[highestEducation]!);

  // Seniority follows years since graduation, not random chance.
  const gradAge = highestEducation === "DOCTORATE" ? 27 : highestEducation === "MASTERS" ? 24 : 22;
  const yearsExperience = Math.max(0, age - gradAge);
  const rung = Math.min(profession.ladder.length - 1, Math.floor(yearsExperience / 4));
  const designation = profession.ladder[rung];

  // Income: base → seniority → city cost of living → individual variance.
  const lpa = profession.baseLpa
    * Math.pow(profession.seniorityStep, rung)
    * city.incomeMultiplier
    * faker.number.float({ min: 0.85, max: 1.2 });
  const annualIncome = Math.round((lpa * 100_000) / 50_000) * 50_000;

  const casteOptions =
    CASTES_BY_RELIGION[religion]?.[region] ?? CASTES_BY_RELIGION[religion]?.DEFAULT ?? [];
  const motherTongue = MOTHER_TONGUE_BY_REGION[region];

  // Jains are vegetarian by definition; others follow regional patterns.
  const diet = religion === "Jain"
    ? "JAIN"
    : weighted(["VEG", "NON_VEG", "EGGETARIAN", "VEGAN"] as const, (d) => {
        const vegLeaning = ["GUJARAT", "DELHI_NCR", "MAHARASHTRA"].includes(region);
        if (d === "VEG") return vegLeaning ? 6 : 3;
        if (d === "NON_VEG") return vegLeaning ? 3 : 6;
        if (d === "EGGETARIAN") return 2;
        return 0.4;
      });

  const maritalStatus = weighted(
    ["NEVER_MARRIED", "DIVORCED", "WIDOWED"] as const,
    (s) => (s === "NEVER_MARRIED" ? 88 : s === "DIVORCED" ? 10 : 2),
  );

  const familyValues = weighted(["TRADITIONAL", "MODERATE", "LIBERAL"] as const, (v) =>
    v === "MODERATE" ? 5 : v === "TRADITIONAL" ? 3 : 2,
  );

  const slug = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "");

  return {
    firstName, lastName, gender, dateOfBirth,
    photoUrl: null,
    about: null,
    profileCreatedBy: weighted(["SELF", "PARENT", "SIBLING", "RELATIVE"] as const, (c) =>
      c === "SELF" ? 6 : c === "PARENT" ? 3 : 1,
    ),
    // Clients are verified during onboarding; pool profiles mostly are.
    isVerified: opts.isClient ? true : faker.datatype.boolean({ probability: 0.92 }),

    country: "India",
    state: city.state,
    city: city.name,
    heightCm: heightCm(gender),

    email: `${slug}.${faker.string.alphanumeric(4).toLowerCase()}@example.com`,
    phone: `+91${faker.string.numeric({ length: 10, allowLeadingZeros: false })}`,

    undergradCollege: faker.helpers.arrayElement(COLLEGES[tier]),
    degree,
    highestEducation,
    annualIncome,
    company: faker.helpers.arrayElement(profession.employers),
    designation,

    maritalStatus,
    languages: faker.helpers.arrayElements(
      [...new Set([motherTongue, "Hindi", "English", ...LANGUAGE_POOL])],
      faker.number.int({ min: 2, max: 4 }),
    ),
    motherTongue,
    religion,
    caste: casteOptions.length ? faker.helpers.arrayElement(casteOptions) : null,
    subCaste: null,
    gotra: religion === "Hindu" ? faker.helpers.arrayElement(GOTRAS) : null,
    manglik: religion === "Hindu"
      ? weighted(["NO", "YES", "PARTIAL", "DONT_KNOW"] as const, (m) =>
          m === "NO" ? 6 : m === "DONT_KNOW" ? 3 : 1.5)
      : "DONT_KNOW",

    brothers: faker.number.int({ min: 0, max: 2 }),
    sisters: faker.number.int({ min: 0, max: 2 }),
    familyType: weighted(["NUCLEAR", "JOINT"] as const, (t) => (t === "NUCLEAR" ? 7 : 3)),
    familyValues,
    fatherOccupation: faker.helpers.arrayElement(PARENT_OCCUPATIONS.father),
    motherOccupation: faker.helpers.arrayElement(PARENT_OCCUPATIONS.mother),

    diet,
    // Smoking and drinking track family values, and women smoke far less.
    smoking: weighted(["NO", "OCCASIONALLY", "YES"] as const, (h) => {
      if (h === "NO") return gender === "FEMALE" ? 24 : 7;
      if (h === "OCCASIONALLY") return familyValues === "LIBERAL" ? 3 : 1.5;
      return familyValues === "LIBERAL" ? 1.5 : 0.5;
    }),
    drinking: weighted(["NO", "OCCASIONALLY", "YES"] as const, (h) => {
      if (h === "NO") return familyValues === "TRADITIONAL" ? 9 : 4;
      if (h === "OCCASIONALLY") return familyValues === "LIBERAL" ? 6 : 3;
      return familyValues === "LIBERAL" ? 1.5 : 0.4;
    }),

    wantKids: weighted(["YES", "MAYBE", "NO"] as const, (k) =>
      k === "YES" ? 7 : k === "MAYBE" ? 2.5 : 0.8,
    ),
    openToRelocate: weighted(["YES", "MAYBE", "NO"] as const, (r) =>
      r === "MAYBE" ? 4 : r === "YES" ? 3.5 : 2.5,
    ),
    openToPets: faker.helpers.arrayElement(["YES", "NO", "MAYBE"] as const),

    isClient: opts.isClient,
    _meta: { region, age, professionField: profession.field },
  };
}
