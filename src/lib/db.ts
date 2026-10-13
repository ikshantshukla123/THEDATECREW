import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

/**
 * pg over the POOLED Neon endpoint, not the serverless WebSocket driver.
 * That driver exists for the Edge runtime, and nothing here queries from
 * Edge — proxy.ts only verifies a JWT. In practice its WebSocket transport
 * failed intermittently with an opaque ErrorEvent.
 */
function createClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 20_000,
  });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        return withRetry(() => query(args));
      },
    },
  });
}

/** Connection faults worth another attempt; a constraint violation is not. */
const TRANSIENT = /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EPIPE|Closed|terminating connection|Can't reach database|P1001|P1017|P2024/i;

function isTransient(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return TRANSIENT.test(`${e?.code ?? ""} ${e?.message ?? ""}`);
}

/**
 * Neon's free tier suspends idle computes. The first connection after a
 * pause is rejected outright — fast, not a timeout — and only succeeds once
 * the compute has woken, which takes a couple of seconds. Without this the
 * first page load after any quiet period errors.
 */
async function withRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isTransient(error)) throw error;
      await new Promise((r) => setTimeout(r, attempt * 800));
    }
  }
  throw lastError;
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

// Reuse across hot reloads so dev doesn't exhaust Neon's connection limit.
if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * The client handed to a $transaction callback. Derived from the extended
 * client, since extending changes the type away from Prisma.TransactionClient.
 */
export type Tx = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
