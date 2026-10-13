"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { ok, toActionResult, type ActionResult } from "@/lib/result";
import { AddNoteSchema } from "./schemas";
import * as service from "./service";

export async function addNoteAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    const parsed = AddNoteSchema.parse(input);
    await service.addNote(session.matchmakerId, parsed);
    revalidatePath(`/customers/${parsed.profileId}/notes`);
    revalidatePath(`/customers/${parsed.profileId}/activity`);
    revalidatePath("/customers");
    return ok(undefined);
  } catch (error) {
    return toActionResult(error);
  }
}
