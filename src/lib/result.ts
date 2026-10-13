import { AppError } from "./errors";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string): ActionResult<never> {
  return { ok: false, error: { code, message } };
}

/**
 * Server actions return failures, they do not throw them. Unknown errors are
 * logged and replaced with a generic message so internals never reach the UI.
 */
export function toActionResult(error: unknown): ActionResult<never> {
  if (error instanceof AppError) return fail(error.code, error.message);
  console.error("[unhandled]", error);
  return fail("INTERNAL", "Something went wrong. Please try again.");
}
