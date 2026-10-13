import "server-only";
import type { NoteType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { logActivity } from "@/features/audit/service";
import { findClientById } from "@/features/customers/repo";
import * as repo from "./repo";

export function getNotes(profileId: string) {
  return repo.listNotes(profileId);
}

export async function addNote(
  matchmakerId: string,
  input: { profileId: string; type: NoteType; body: string },
) {
  const client = await findClientById(matchmakerId, input.profileId);
  if (!client) throw new NotFoundError("Client");

  await prisma.$transaction(async (tx) => {
    await tx.note.create({
      data: {
        profileId: input.profileId,
        authorId: matchmakerId,
        type: input.type,
        body: input.body,
      },
    });

    // A call or meeting is contact; a general note is not.
    if (input.type !== "GENERAL") {
      await tx.customerPipeline.update({
        where: { profileId: input.profileId },
        data: { lastContactAt: new Date() },
      });
    }

    await logActivity(tx, {
      actorId: matchmakerId,
      profileId: input.profileId,
      type: "NOTE_ADDED",
      payload: { noteType: input.type },
    });
  });
}
