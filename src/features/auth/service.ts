import "server-only";
import { ValidationError, RateLimitError } from "@/lib/errors";
import { verifyPassword } from "@/lib/auth/password";
import {
  isRateLimited, recordAttempt, RATE_LIMIT_WINDOW_MINUTES,
} from "@/lib/auth/rate-limit";
import { createSession, destroySession, type Session } from "@/lib/auth/session";
import { findMatchmakerByEmail } from "./repo";

export async function login(
  input: { email: string; password: string },
  ip: string | null,
): Promise<Session> {
  const email = input.email.trim().toLowerCase();

  if (await isRateLimited(email, ip)) {
    throw new RateLimitError(
      `Too many failed attempts. Try again in ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
    );
  }

  const matchmaker = await findMatchmakerByEmail(email);

  // Verify against a dummy hash when the account is missing, so a wrong email
  // and a wrong password take the same time to answer.
  const valid = matchmaker
    ? await verifyPassword(input.password, matchmaker.passwordHash)
    : await verifyPassword(input.password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");

  await recordAttempt(email, ip, Boolean(matchmaker) && valid);

  if (!matchmaker || !valid) {
    // One message for both cases — never confirm which emails exist.
    throw new ValidationError("Email or password is incorrect");
  }

  const session: Session = {
    matchmakerId: matchmaker.id,
    name: matchmaker.name,
    email: matchmaker.email,
  };
  await createSession(session);
  return session;
}

export async function logout(): Promise<void> {
  await destroySession();
}
