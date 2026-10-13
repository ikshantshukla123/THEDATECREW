import { z } from "zod";
import type { FactorName, Preference } from "./types";
import type { Strategy } from "./config";

const FACTOR_NAMES = [
  "age", "height", "income", "career", "education", "kids",
  "relocation", "values", "lifestyle", "language", "location",
] as const satisfies readonly FactorName[];

/**
 * weightOverrides is untyped JSON on the way in. Validate on read as well as
 * on write — rows written before a schema change are still in the database.
 */
// partialRecord, not record: with an enum key z.record is EXHAUSTIVE in
// zod 4, so { income: 0 } fails validation and .catch(null) would silently
// discard every override.
export const WeightOverridesSchema = z
  .partialRecord(z.enum(FACTOR_NAMES), z.number().min(0).max(100))
  .nullable()
  .catch(null);

/**
 * A preference the client actually typed should outweigh one we inferred from
 * their own biodata. Scores are normalised by total weight, so raising these
 * does not break the sum-to-100 invariant on the base strategies.
 */
const EMPHASIS: Array<[keyof Preference, FactorName, number]> = [
  ["cities", "location", 2.5],
  ["motherTongues", "language", 2.5],
  ["diets", "lifestyle", 1.5],
];

export function emphasiseStated(base: Strategy, preference: Preference | null): Strategy {
  if (!preference) return base;

  const merged: Strategy = { ...base };
  for (const [field, factor, multiplier] of EMPHASIS) {
    const stated = preference[field];
    if (!Array.isArray(stated) || stated.length === 0) continue;
    const current = merged[factor];
    if (current) merged[factor] = { weight: current.weight * multiplier };
  }
  return merged;
}

export function applyOverrides(base: Strategy, raw: unknown): Strategy {
  const overrides = WeightOverridesSchema.parse(raw);
  if (!overrides) return base;

  const merged: Strategy = { ...base };
  for (const [factor, weight] of Object.entries(overrides)) {
    if (weight === undefined) continue;
    // Only tune factors the strategy already uses; an override cannot
    // introduce a factor this gender's strategy does not score on.
    if (merged[factor as FactorName]) merged[factor as FactorName] = { weight };
  }
  return merged;
}
