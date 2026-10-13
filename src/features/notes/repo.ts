import "server-only";
import { prisma } from "@/lib/db";

export function listNotes(profileId: string) {
  return prisma.note.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
}

export type NoteRow = Awaited<ReturnType<typeof listNotes>>[number];
