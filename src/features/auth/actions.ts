"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { toActionResult, ok, type ActionResult } from "@/lib/result";
import { LoginSchema } from "./schemas";
import * as service from "./service";

/** Trusts the proxy header; Vercel sets it and strips client-supplied copies. */
async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function loginAction(input: unknown): Promise<ActionResult<void>> {
  try {
    const parsed = LoginSchema.parse(input);
    await service.login(parsed, await clientIp());
    return ok(undefined);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function logoutAction(): Promise<void> {
  await service.logout();
  redirect("/login");
}
