import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "./env";

// Pooled URL for the app; migrations use DIRECT_URL via prisma.config.ts.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

// Reuse across hot reloads so dev doesn't exhaust Neon's connection limit.
if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
