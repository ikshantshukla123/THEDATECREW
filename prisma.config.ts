import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed/index.ts",
  },
  // Migrations must not run through PgBouncer — advisory locks and DDL break.
  datasource: { url: process.env.DIRECT_URL },
});
