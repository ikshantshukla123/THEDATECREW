import { z } from "zod";

const TIERS = ["HIGH_POTENTIAL", "GOOD", "WORTH_EXPLORING", "LOW"] as const;

/**
 * Semantic fields are strict — a bad tier or an unknown ref is a real error.
 * Cosmetic limits CLAMP rather than reject: a model that returns seven good
 * reasons instead of three should not cost us the whole batch.
 */
export const RankedMatchSchema = z.object({
  ref: z.string().min(1),
  tier: z.enum(TIERS),
  reasons: z
    .array(z.string())
    .min(1)
    .transform((rs) => rs.map((r) => r.trim().slice(0, 140)).filter(Boolean).slice(0, 3)),
  concern: z
    .string()
    .nullable()
    .transform((c) => {
      const trimmed = c?.trim();
      return trimmed ? trimmed.slice(0, 140) : null;
    }),
});

export const RankResponseSchema = z.object({
  matches: z.array(RankedMatchSchema),
});

export type RankedMatch = z.infer<typeof RankedMatchSchema>;

export const IntroSchema = z.object({
  subject: z.string().min(1).transform((s) => s.trim().slice(0, 120)),
  body: z.string().min(1).transform((s) => s.trim().slice(0, 1600)),
});

export const RANK_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches"],
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ref", "tier", "reasons", "concern"],
        properties: {
          ref: { type: "string" },
          tier: { type: "string", enum: TIERS },
          reasons: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
          concern: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;
