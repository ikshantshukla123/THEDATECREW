import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "tdc_session";
const MAX_AGE_SECONDS = 8 * 60 * 60;

const secret = new TextEncoder().encode(env.AUTH_SECRET);

export type Session = { matchmakerId: string; name: string; email: string };

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ name: session.name, email: session.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.matchmakerId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * The real authorization boundary. proxy.ts keeps unauthenticated users out
 * of the UI, but every server action calls this before touching data.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Edge-safe: no cookies(), no Node APIs — proxy.ts calls this. */
export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      matchmakerId: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}
