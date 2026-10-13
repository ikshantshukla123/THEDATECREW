import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { PrismaClient, type PipelineStatus, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { makeProfile } from "./factories/profile.factory";
import { makePreference } from "./factories/preference.factory";

// Direct TCP, not the serverless WebSocket driver the app uses — this is a
// long-running script doing bulk writes, which is what pg is built for.
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL!,
    // Neon's free tier suspends idle computes; the first query has to wake
    // one, which overruns pg's default connect timeout.
    connectionTimeoutMillis: 30_000,
  }),
});

// Fixed seed: reseeding produces an identical dataset, so screenshots,
// demos and tests stay stable.
faker.seed(42);

const DEMO_PASSWORD = "matchmaker123";

const MATCHMAKERS = [
  { name: "Harshit Tomar", email: "harshit@thedatingcompany.in" },
  { name: "Ritika Malhotra", email: "ritika@thedatingcompany.in" },
  { name: "Dev Anand", email: "dev@thedatingcompany.in" },
];

const CLIENTS_PER_GENDER = 20;
const POOL_PER_GENDER = 150;

/** Pipeline spread — weighted so the funnel looks like a real book of work. */
const PIPELINE_SPREAD: Array<[PipelineStatus, number]> = [
  ["NEW", 6], ["VERIFIED", 7], ["SHORTLISTING", 9], ["MATCH_SENT", 8],
  ["MEETING_SCHEDULED", 5], ["ON_HOLD", 3], ["MATCHED", 2], ["CLOSED", 2],
];

function pickStatus(): PipelineStatus {
  const total = PIPELINE_SPREAD.reduce((s, [, w]) => s + w, 0);
  let roll = faker.number.float({ min: 0, max: total });
  for (const [status, w] of PIPELINE_SPREAD) {
    roll -= w;
    if (roll <= 0) return status;
  }
  return "NEW";
}

const NOTE_BODIES = {
  CALL: [
    "Spoke for 20 minutes. Wants to prioritise someone in the same city — travel is a real constraint with the current job.",
    "Call went well. Family is keen to move quickly but the client wants to take it slow. Worth managing expectations on both sides.",
    "Discussed the last two profiles. Felt the education gap was too wide. Noted for future shortlisting.",
    "Short call. Asked us to pause for a few weeks — work deadline. Will resume after.",
  ],
  MEETING: [
    "Met at the Pune office with parents. Family values matter more than career here; worth weighting that higher.",
    "Coffee meeting. Much warmer in person than over the phone. Open to profiles slightly outside the stated age band.",
    "Met along with elder brother. Clear that relocation abroad is a dealbreaker.",
  ],
  GENERAL: [
    "Updated preferences after the last conversation — widened the height range.",
    "Photographs refreshed. Profile reads much better now.",
    "Flagged for follow-up: no contact in a while and the profile is going stale.",
    "Mentioned a preference for someone from a nuclear family. Not a dealbreaker, but a strong lean.",
  ],
};

/**
 * Neon's free tier suspends idle computes. The first query has to wake one,
 * which can exceed the connect timeout — so retry before doing real work
 * rather than failing the whole seed on a cold start.
 */
async function waitForDatabase(attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch {
      if (i === attempts) throw new Error(`Database unreachable after ${attempts} attempts`);
      console.log(`  database asleep, retrying (${i}/${attempts})...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function main() {
  console.log("Waking database...");
  await waitForDatabase();

  console.log("Clearing existing data...");
  // Order matters: children before parents.
  await prisma.emailOutbox.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.note.deleteMany();
  await prisma.match.deleteMany();
  await prisma.customerPipeline.deleteMany();
  await prisma.partnerPreference.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.matchmaker.deleteMany();

  console.log("Creating matchmakers...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const matchmakers = [];
  for (const m of MATCHMAKERS) {
    matchmakers.push(await prisma.matchmaker.create({ data: { ...m, passwordHash } }));
  }

  console.log(`Creating ${POOL_PER_GENDER * 2} pool profiles...`);
  const poolData: Prisma.ProfileCreateManyInput[] = [];
  for (const gender of ["MALE", "FEMALE"] as const) {
    for (let i = 0; i < POOL_PER_GENDER; i++) {
      const { _meta, ...row } = makeProfile(gender, { isClient: false });
      void _meta;
      poolData.push(row as Prisma.ProfileCreateManyInput);
    }
  }
  await prisma.profile.createMany({ data: poolData });

  console.log(`Creating ${CLIENTS_PER_GENDER * 2} clients...`);
  // Profiles must be created one at a time — createMany cannot write the
  // nested preference and pipeline rows. Notes and activity are collected
  // and written in bulk afterwards to keep the round-trip count down.
  const notes: Prisma.NoteCreateManyInput[] = [];
  const activity: Prisma.ActivityLogCreateManyInput[] = [];
  let clientIndex = 0;

  for (const gender of ["MALE", "FEMALE"] as const) {
    for (let i = 0; i < CLIENTS_PER_GENDER; i++) {
      const generated = makeProfile(gender, { isClient: true });
      const { _meta, ...row } = generated;
      void _meta;
      const matchmaker = matchmakers[clientIndex % matchmakers.length];
      clientIndex++;
      const status = pickStatus();

      // Clients further along the pipeline have been contacted more recently.
      const staleDays = ["NEW", "ON_HOLD", "CLOSED"].includes(status)
        ? faker.number.int({ min: 15, max: 45 })
        : faker.number.int({ min: 1, max: 20 });

      const client = await prisma.profile.create({
        select: { id: true },
        data: {
          ...(row as Prisma.ProfileCreateInput),
          matchmaker: { connect: { id: matchmaker.id } },
          preference: { create: makePreference(generated) },
          pipeline: {
            create: { status, lastContactAt: faker.date.recent({ days: staleDays }) },
          },
        },
      });

      const noteCount = status === "NEW"
        ? faker.number.int({ min: 0, max: 1 })
        : faker.number.int({ min: 1, max: 4 });
      for (let n = 0; n < noteCount; n++) {
        const type = faker.helpers.arrayElement(["CALL", "MEETING", "GENERAL"] as const);
        notes.push({
          profileId: client.id,
          authorId: matchmaker.id,
          type,
          body: faker.helpers.arrayElement(NOTE_BODIES[type]),
          createdAt: faker.date.recent({ days: 60 }),
        });
      }

      activity.push({
        actorId: matchmaker.id,
        profileId: client.id,
        type: "STATUS_CHANGED",
        payload: { from: "NEW", to: status },
        createdAt: faker.date.recent({ days: 50 }),
      });
    }
  }

  console.log(`Writing ${notes.length} notes and ${activity.length} activity rows...`);
  await prisma.note.createMany({ data: notes });
  await prisma.activityLog.createMany({ data: activity });

  console.log("Summary");
  console.table({
    matchmakers: await prisma.matchmaker.count(),
    clients: await prisma.profile.count({ where: { isClient: true } }),
    poolProfiles: await prisma.profile.count({ where: { isClient: false } }),
    notes: await prisma.note.count(),
    activity: await prisma.activityLog.count(),
  });

  console.log("\nSign in with any of:");
  for (const m of MATCHMAKERS) console.log(`  ${m.email}  /  ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
