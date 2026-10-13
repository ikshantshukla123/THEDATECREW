"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { ok, toActionResult, type ActionResult } from "@/lib/result";
import { RevealContactSchema, UpdateStatusSchema } from "./schemas";
import * as service from "./service";

export async function updateStatusAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    const { profileId, status } = UpdateStatusSchema.parse(input);
    await service.updateStatus(session.matchmakerId, profileId, status);
    revalidatePath(`/customers/${profileId}`);
    revalidatePath("/customers");
    return ok(undefined);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function revealContactAction(
  input: unknown,
): Promise<ActionResult<{ email: string; phone: string }>> {
  try {
    const session = await requireSession();
    const { profileId } = RevealContactSchema.parse(input);
    const contact = await service.revealContact(session.matchmakerId, profileId);
    revalidatePath(`/customers/${profileId}/activity`);
    return ok(contact);
  } catch (error) {
    return toActionResult(error);
  }
}
