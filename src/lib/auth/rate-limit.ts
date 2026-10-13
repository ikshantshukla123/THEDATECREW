import "server-only";
import { prisma } from "@/lib/db";

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 5;

/**
 * DB-backed rather than in-memory: on serverless there is no shared process
 * to hold a counter. Limits on email *and* IP — email alone does nothing
 * against an attacker rotating addresses from one host.
 */
export async function isRateLimited(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);

  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    }),
    ip
      ? prisma.loginAttempt.count({
          where: { ip, success: false, createdAt: { gte: since } },
        })
      : Promise.resolve(0),
  ]);

  return byEmail >= MAX_FAILURES || byIp >= MAX_FAILURES * 4;
}

export async function recordAttempt(
  email: string,
  ip: string | null,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { email, ip, success } });
}

export const RATE_LIMIT_WINDOW_MINUTES = WINDOW_MINUTES;
