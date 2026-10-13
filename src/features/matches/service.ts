import "server-only";
import type { MatchTier, Prisma } from "@prisma/client";
import { prisma, withRetry } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { logActivity } from "@/features/audit/service";
import { findClientById } from "@/features/customers/repo";
import { buildCandidateFilter } from "@/lib/matching/filters";
import { pairHash, rankCandidates, tierForScore } from "@/lib/matching";
import type { MatchProfile, Preference } from "@/lib/matching/types";
import { sanitize } from "@/lib/ai/sanitize";
import { rankWithAi } from "@/lib/ai/rank-matches";
import { writeIntro } from "@/lib/ai/write-intro";
import * as repo from "./repo";

/** Stage 1 shortlist size, then the top N go to the model. */
const CANDIDATE_POOL = 120;
/**
 * Six, not ten. The reasoning model emits ~550 output tokens per candidate;
 * at ten it took 70s and returned an empty array, at six it is 38s and
 * reliable.
 */
const SHORTLIST = 6;

export async function getMatches(clientId: string) {
  const matches = await repo.listMatches(clientId);
  const overlap = await repo.countCandidateOverlap(
    matches.map((m) => m.candidateId),
    clientId,
  );
  return matches.map((m) => ({
    ...m,
    overlap: overlap.get(m.candidateId) ?? { shortlisted: 0, sent: 0 },
  }));
}

export type MatchWithOverlap = Awaited<ReturnType<typeof getMatches>>[number];

export async function generateMatches(matchmakerId: string, clientId: string) {
  const client = await findClientById(matchmakerId, clientId);
  if (!client) throw new NotFoundError("Client");

  const now = new Date();
  const preference = (client.preference ?? null) as Preference | null;
  const clientProfile = client as unknown as MatchProfile;

  // Skipped, sent and answered candidates never come back.
  const existing = await repo.findExistingMatches(clientId);
  const excluded = existing
    .filter((m) => m.status !== "SUGGESTED" && m.status !== "SAVED")
    .map((m) => m.candidateId);

  // Stage 1 — hard filters in Postgres.
  const where = buildCandidateFilter(clientProfile, preference, excluded, now);
  const candidates = (await repo.findCandidates(where, CANDIDATE_POOL)) as MatchProfile[];

  if (candidates.length === 0) {
    return { generated: 0, aiUsed: false, aiReason: "No candidates passed the hard filters" };
  }

  // Stage 2 — deterministic scoring.
  const ranked = rankCandidates(clientProfile, candidates, { now, preference }).slice(0, SHORTLIST);
  const byId = new Map(candidates.map((c) => [c.id, c]));

  // Stage 3 — one batched AI call, refining what the engine already decided.
  const refs = new Map<string, string>();
  ranked.forEach((r, i) => refs.set(`C${i + 1}`, r.candidateId));

  const outcome = await rankWithAi({
    client: sanitize(clientProfile, "CLIENT", now),
    candidates: ranked.map((r, i) => ({
      profile: sanitize(byId.get(r.candidateId)!, `C${i + 1}`, now),
      ruleScore: r.ruleScore,
      breakdown: r.breakdown,
    })),
  });

  const rows: Prisma.MatchCreateManyInput[] = ranked.map((r, i) => {
    const candidate = byId.get(r.candidateId)!;
    const ai = outcome.source === "ai" ? outcome.matches.get(`C${i + 1}`) : undefined;

    // Per candidate, not per batch: a model that skipped one row still
    // leaves the rest annotated.
    const tier: MatchTier = ai?.tier ?? tierForScore(r.ruleScore);
    const reasons = ai?.reasons ?? r.breakdown.slice(0, 2).map((b) => b.reason);
    const concern = ai?.concern ?? weakestReason(r.breakdown);

    return {
      clientId,
      candidateId: r.candidateId,
      ruleScore: r.ruleScore,
      ruleBreakdown: r.breakdown as unknown as Prisma.InputJsonValue,
      aiTier: tier,
      aiReasons: reasons,
      aiConcern: concern,
      aiModel: outcome.source === "ai" ? outcome.model : null,
      pairHash: pairHash(clientProfile, candidate, preference),
      status: "SUGGESTED" as const,
    };
  });

  // The AI call already finished — no network is held open in here. Still
  // needs generous limits: ten upserts over a serverless connection comfortably
  // exceed Prisma's 2s maxWait / 5s timeout defaults.
  await withRetry(() => prisma.$transaction(
    async (tx) => {
      // Upsert, never delete-and-insert: a SENT or SKIPPED row must survive.
      for (const row of rows) {
        await tx.match.upsert({
          where: { clientId_candidateId: { clientId, candidateId: row.candidateId } },
          create: row,
          update: {
            ruleScore: row.ruleScore,
            ruleBreakdown: row.ruleBreakdown,
            aiTier: row.aiTier,
            aiReasons: row.aiReasons,
            aiConcern: row.aiConcern,
            aiModel: row.aiModel,
            pairHash: row.pairHash,
          },
        });
      }
      await logActivity(tx, {
        actorId: matchmakerId,
        profileId: clientId,
        type: "MATCHES_GENERATED",
        payload: { count: rows.length, source: outcome.source },
      });
    },
    { maxWait: 20_000, timeout: 60_000 },
  ));

  return {
    generated: rows.length,
    aiUsed: outcome.source === "ai",
    aiReason: outcome.source === "fallback" ? outcome.reason : null,
  };
}

/** The lowest-scoring factor becomes the honest concern when AI is absent. */
function weakestReason(breakdown: Array<{ score: number; reason: string }>): string | null {
  const weakest = [...breakdown].sort((a, b) => a.score - b.score)[0];
  return weakest && weakest.score < 0.5 ? weakest.reason : null;
}


/**
 * Generated once and cached on the Match row, so reopening the dialog costs
 * nothing. `regenerate` forces a fresh call.
 */
export async function getIntro(
  matchmakerId: string,
  clientId: string,
  matchId: string,
  options: { regenerate?: boolean } = {},
) {
  const client = await findClientById(matchmakerId, clientId);
  if (!client) throw new NotFoundError("Client");

  const match = await prisma.match.findFirst({
    where: { id: matchId, clientId },
    include: { candidate: { select: { ...repo.MATCH_PROFILE_SELECT, firstName: true } } },
  });
  if (!match) throw new NotFoundError("Match");

  if (!options.regenerate && match.introSubject && match.introBody) {
    return { subject: match.introSubject, body: match.introBody, source: "cached" as const };
  }

  const matchmaker = client.matchmaker;
  const intro = await writeIntro({
    clientFirstName: client.firstName,
    candidateFirstName: match.candidate.firstName,
    matchmakerFirstName: (matchmaker?.name ?? "The Dating Company").split(" ")[0],
    candidate: sanitize(match.candidate as unknown as MatchProfile, "CANDIDATE", new Date()),
    reasons: Array.isArray(match.aiReasons) ? (match.aiReasons as string[]) : [],
  });

  // Cache it so the next open is instant.
  await prisma.match.update({
    where: { id: matchId },
    data: { introSubject: intro.subject, introBody: intro.body },
  });

  return { subject: intro.subject, body: intro.body, source: intro.source };
}

/**
 * ARCHITECTURE.md §11. One transaction so the match, the queued email, the
 * pipeline move and the audit row can never disagree.
 */
export async function sendMatch(
  matchmakerId: string,
  input: { clientId: string; matchId: string; subject: string; body: string },
) {
  const client = await findClientById(matchmakerId, input.clientId);
  if (!client) throw new NotFoundError("Client");

  const match = await prisma.match.findFirst({
    where: { id: input.matchId, clientId: input.clientId },
    select: { id: true, status: true, aiTier: true, candidateId: true },
  });
  if (!match) throw new NotFoundError("Match");
  if (match.status !== "SUGGESTED" && match.status !== "SAVED") {
    throw new ValidationError("This match has already been sent");
  }

  const sentAt = new Date();
  const movesPipeline = client.pipeline?.status === "SHORTLISTING";

  await withRetry(() => prisma.$transaction(
    async (tx) => {
      await tx.match.update({
        where: { id: match.id },
        data: {
          status: "SENT",
          sentAt,
          introSubject: input.subject,
          introBody: input.body,
        },
      });

      // Outbox pattern: the mutation and the email can never disagree. A
      // real sender would drain QUEUED rows; the mock marks them SENT.
      await tx.emailOutbox.create({
        data: {
          matchId: match.id,
          to: client.email,
          subject: input.subject,
          body: input.body,
          status: "SENT",
        },
      });

      if (movesPipeline) {
        await tx.customerPipeline.update({
          where: { profileId: input.clientId },
          data: { status: "MATCH_SENT", lastContactAt: sentAt },
        });
        await logActivity(tx, {
          actorId: matchmakerId,
          profileId: input.clientId,
          type: "STATUS_CHANGED",
          payload: { from: "SHORTLISTING", to: "MATCH_SENT" },
        });
      } else {
        await tx.customerPipeline.update({
          where: { profileId: input.clientId },
          data: { lastContactAt: sentAt },
        });
      }

      await logActivity(tx, {
        actorId: matchmakerId,
        profileId: input.clientId,
        type: "MATCH_SENT",
        payload: { candidateId: match.candidateId, tier: match.aiTier },
      });
    },
    { maxWait: 20_000, timeout: 60_000 },
  ));

  return { movedPipeline: movesPipeline };
}
