import "server-only";
import { prisma } from "@/lib/db";

export function findMatchmakerByEmail(email: string) {
  return prisma.matchmaker.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });
}
