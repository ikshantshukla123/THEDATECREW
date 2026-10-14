import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getAiClient } from "./client";
import { buildIntroPrompt, INTRO_SYSTEM } from "./prompts";
import { IntroSchema } from "./schemas";
import type { SanitizedProfile } from "./sanitize";

export type IntroInput = {
  clientFirstName: string;
  candidateFirstName: string;
  matchmakerFirstName: string;
  candidate: SanitizedProfile;
  reasons: string[];
};

export type Intro = { subject: string; body: string; source: "ai" | "template"; model: string | null };

/**
 * Reasoning model first, unlike ranking. This is one short email a matchmaker
 * asked for, so a second or two matters far less than accuracy — the smaller
 * model embellishes, inventing interests and character traits that are not in
 * the profile. Ranking stays fast-first because it is a batch of ten.
 *
 * Free endpoints are rate-limited per shared upstream pool, independent of
 * our own key quota, so one model being busy must not block a send.
 */
function modelChain(): string[] {
  const chain = [env.AI_MODEL_REASONING, env.AI_MODEL_FAST].filter(Boolean) as string[];
  return [...new Set(chain)];
}

export async function writeIntro(input: IntroInput): Promise<Intro> {
  const client = getAiClient();
  if (client) {
    for (const model of modelChain()) {
      const startedAt = Date.now();
      try {
        const response = await client.chat.completions.create({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: INTRO_SYSTEM },
            { role: "user", content: buildIntroPrompt(input) },
          ],
        });

        const raw = response.choices[0]?.message?.content;
        if (!raw) throw new Error("empty response");
        const parsed = IntroSchema.parse(JSON.parse(raw));

        logger.info("ai.intro", {
          model,
          durationMs: Date.now() - startedAt,
          completionTokens: response.usage?.completion_tokens,
        });

        // The model never saw a name; substitute it now.
        return {
          subject: fillName(parsed.subject, input.candidateFirstName),
          body: fillName(parsed.body, input.candidateFirstName),
          source: "ai",
          model,
        };
      } catch (error) {
        logger.warn("ai.intro.failed", {
          model,
          durationMs: Date.now() - startedAt,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return { ...template(input), source: "template", model: null };
}

function fillName(text: string, name: string): string {
  return text.replaceAll("{{name}}", name).replaceAll("{{ name }}", name);
}

/** Sending must work with no AI at all; the matchmaker edits before sending. */
function template(input: IntroInput): { subject: string; body: string } {
  const { candidate, candidateFirstName, clientFirstName, matchmakerFirstName, reasons } = input;
  const why = reasons.length
    ? reasons.map((r) => `· ${r}`).join("\n")
    : "· Your preferences line up well on the things that matter most";

  return {
    subject: `A profile I think you'll like, ${clientFirstName}`,
    body:
      `Hi ${clientFirstName},\n\n` +
      `I'd like to introduce you to ${candidateFirstName}, ${candidate.age}, ` +
      `a ${candidate.profession.toLowerCase()} based in ${candidate.city}.\n\n` +
      `Why I thought of you both:\n${why}\n\n` +
      `Would you like me to set up a call?\n\n` +
      `Warmly,\n${matchmakerFirstName}`,
  };
}
