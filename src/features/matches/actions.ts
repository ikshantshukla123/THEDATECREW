"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ok, toActionResult, type ActionResult } from "@/lib/result";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/features/audit/service";
import { findClientById } from "@/features/customers/repo";
import * as service from "./service";

const GenerateSchema = z.object({ clientId: z.string().min(1) });
const IntroSchema = z.object({
  clientId: z.string().min(1),
  matchId: z.string().min(1),
  regenerate: z.boolean().optional(),
});
const SendSchema = z.object({
  clientId: z.string().min(1),
  matchId: z.string().min(1),
  subject: z.string().trim().min(1, "Subject cannot be empty").max(200),
  body: z.string().trim().min(1, "Write something before sending").max(4000),
});
const MatchActionSchema = z.object({
  clientId: z.string().min(1),
  matchId: z.string().min(1),
});

export async function generateMatchesAction(
  input: unknown,
): Promise<ActionResult<{ generated: number; aiUsed: boolean; aiReason: string | null }>> {
  try {
    const session = await requireSession();
    const { clientId } = GenerateSchema.parse(input);
    const result = await service.generateMatches(session.matchmakerId, clientId);
    revalidatePath(`/customers/${clientId}/matches`);
    revalidatePath(`/customers/${clientId}/activity`);
    revalidatePath("/customers");
    return ok(result);
  } catch (error) {
    return toActionResult(error);
  }
}

async function setMatchStatus(
  input: unknown,
  status: "SKIPPED" | "SAVED" | "SUGGESTED",
  activity: "MATCH_SKIPPED" | "MATCH_SAVED",
): Promise<ActionResult<void>> {
  const session = await requireSession();
  const { clientId, matchId } = MatchActionSchema.parse(input);

  const client = await findClientById(session.matchmakerId, clientId);
  if (!client) throw new NotFoundError("Client");

  await prisma.$transaction(async (tx) => {
    await tx.match.update({ where: { id: matchId, clientId }, data: { status } });
    await logActivity(tx, {
      actorId: session.matchmakerId,
      profileId: clientId,
      type: activity,
      payload: { matchId },
    });
  });

  revalidatePath(`/customers/${clientId}/matches`);
  revalidatePath(`/customers/${clientId}/activity`);
  return ok(undefined);
}

export async function skipMatchAction(input: unknown): Promise<ActionResult<void>> {
  try {
    return await setMatchStatus(input, "SKIPPED", "MATCH_SKIPPED");
  } catch (error) {
    return toActionResult(error);
  }
}

export async function saveMatchAction(input: unknown): Promise<ActionResult<void>> {
  try {
    return await setMatchStatus(input, "SAVED", "MATCH_SAVED");
  } catch (error) {
    return toActionResult(error);
  }
}

export async function getIntroAction(
  input: unknown,
): Promise<ActionResult<{ subject: string; body: string; source: string }>> {
  try {
    const session = await requireSession();
    const { clientId, matchId, regenerate } = IntroSchema.parse(input);
    const intro = await service.getIntro(session.matchmakerId, clientId, matchId, { regenerate });
    return ok(intro);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function sendMatchAction(
  input: unknown,
): Promise<ActionResult<{ movedPipeline: boolean }>> {
  try {
    const session = await requireSession();
    const parsed = SendSchema.parse(input);
    const result = await service.sendMatch(session.matchmakerId, parsed);
    revalidatePath(`/customers/${parsed.clientId}/matches`);
    revalidatePath(`/customers/${parsed.clientId}/activity`);
    revalidatePath(`/customers/${parsed.clientId}`);
    revalidatePath("/customers");
    revalidatePath("/analytics");
    return ok(result);
  } catch (error) {
    return toActionResult(error);
  }
}
