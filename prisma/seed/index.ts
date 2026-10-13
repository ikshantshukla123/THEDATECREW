import "dotenv/config";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { PrismaClient, type PipelineStatus, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { makeProfile } from "./factories/profile.factory";
import { makePreference } from "./factories/preference.factory";
import { makeMatch } from "./factories/match.factory";

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

// UI-UX.md §1: a matchmaker carries 20-60 clients. Three matchmakers at the
// doc's "~40 total" would give each of them 13, below that floor.
const CLIENTS_PER_GENDER = 39;
const POOL_PER_GENDER = 150;

const AI_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

/**
 * How many matches a client has, and in what state, follows from where they
 * are in the pipeline. Without this the funnel claims clients are at
 * "Match Sent" while the matches table is empty.
 */
const MATCH_PLAN: Partial<Record<PipelineStatus, { suggested: [number, number]; sent: [number, number] }>> = {
  SHORTLISTING:      { suggested: [3, 6], sent: [0, 0] },
  MATCH_SENT:        { suggested: [2, 4], sent: [1, 3] },
  MEETING_SCHEDULED: { suggested: [1, 3], sent: [2, 4] },
  MATCHED:           { suggested: [0, 2], sent: [2, 4] },
  CLOSED:            { suggested: [0, 1], sent: [1, 2] },
};

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

  // Re-read with the fields the match factory scores on.
  const PARTY_SELECT = {
    id: true, firstName: true, city: true, religion: true, motherTongue: true,
    diet: true, familyValues: true, wantKids: true, openToRelocate: true,
    annualIncome: true, heightCm: true, dateOfBirth: true,
    highestEducation: true, designation: true,
  } as const;

  const poolByGender = {
    MALE: await prisma.profile.findMany({
      where: { isClient: false, gender: "MALE", isVerified: true }, select: PARTY_SELECT,
    }),
    FEMALE: await prisma.profile.findMany({
      where: { isClient: false, gender: "FEMALE", isVerified: true }, select: PARTY_SELECT,
    }),
  };

  console.log(`Creating ${CLIENTS_PER_GENDER * 2} clients...`);
  // Profiles must be created one at a time — createMany cannot write the
  // nested preference and pipeline rows. Notes and activity are collected
  // and written in bulk afterwards to keep the round-trip count down.
  const notes: Prisma.NoteCreateManyInput[] = [];
  const activity: Prisma.ActivityLogCreateManyInput[] = [];
  const matches: Prisma.MatchCreateManyInput[] = [];
  const outbox: Array<{ clientId: string; candidateId: string; to: string; subject: string; body: string }> = [];
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

      // Matches, consistent with the pipeline stage.
      const plan = MATCH_PLAN[status];
      if (plan) {
        const candidates = faker.helpers.shuffle(
          [...poolByGender[gender === "MALE" ? "FEMALE" : "MALE"]],
        );
        const clientParty = {
          id: client.id, firstName: row.firstName as string, city: row.city as string,
          religion: row.religion as string, motherTongue: row.motherTongue as string,
          diet: String(row.diet), familyValues: String(row.familyValues),
          wantKids: String(row.wantKids), openToRelocate: String(row.openToRelocate),
          annualIncome: row.annualIncome as number, heightCm: row.heightCm as number,
          dateOfBirth: row.dateOfBirth as Date,
          highestEducation: String(row.highestEducation),
          designation: (row.designation as string) ?? null,
        };

        const nSent = faker.number.int({ min: plan.sent[0], max: plan.sent[1] });
        const nSuggested = faker.number.int({ min: plan.suggested[0], max: plan.suggested[1] });
        let cursor = 0;

        for (let m = 0; m < nSent && cursor < candidates.length; m++, cursor++) {
          const candidate = candidates[cursor];
          const sentAt = faker.date.recent({ days: 35 });

          // Outcome depends on the stage: a MATCHED client accepted someone.
          let outcome: "SENT" | "ACCEPTED" | "DECLINED" = "SENT";
          if (status === "MATCHED" && m === 0) outcome = "ACCEPTED";
          else if (status === "MEETING_SCHEDULED" && m === 0) outcome = "ACCEPTED";
          else outcome = faker.helpers.weightedArrayElement([
            { value: "SENT" as const, weight: 5 },
            { value: "DECLINED" as const, weight: 3 },
            { value: "ACCEPTED" as const, weight: 2 },
          ]);

          matches.push(makeMatch(clientParty, candidate, outcome, sentAt, AI_MODEL));
          outbox.push({
            clientId: client.id, candidateId: candidate.id, to: row.email as string,
            subject: `A profile we think you'll like, ${row.firstName}`,
            body: `Intro for ${candidate.firstName}.`,
          });
          activity.push({
            actorId: matchmaker.id, profileId: client.id, type: "MATCH_SENT",
            payload: { candidateId: candidate.id, tier: "GOOD" }, createdAt: sentAt,
          });
        }

        for (let m = 0; m < nSuggested && cursor < candidates.length; m++, cursor++) {
          matches.push(makeMatch(clientParty, candidates[cursor], "SUGGESTED", null, AI_MODEL));
        }

        if (nSuggested > 0) {
          activity.push({
            actorId: matchmaker.id, profileId: client.id, type: "MATCHES_GENERATED",
            payload: { count: nSuggested }, createdAt: faker.date.recent({ days: 25 }),
          });
        }
      }

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

  console.log(`Writing ${matches.length} matches, ${notes.length} notes, ${activity.length} activity rows...`);
  await prisma.match.createMany({ data: matches });
  await prisma.note.createMany({ data: notes });
  await prisma.activityLog.createMany({ data: activity });

  // Outbox rows need the match ids, so they come after the matches land.
  const sentMatches = await prisma.match.findMany({
    where: { status: { in: ["SENT", "ACCEPTED", "DECLINED"] } },
    select: { id: true, clientId: true, candidateId: true },
  });
  const byPair = new Map(sentMatches.map((m) => [`${m.clientId}:${m.candidateId}`, m.id]));
  await prisma.emailOutbox.createMany({
    data: outbox.flatMap((o) => {
      const matchId = byPair.get(`${o.clientId}:${o.candidateId}`);
      return matchId ? [{ matchId, to: o.to, subject: o.subject, body: o.body, status: "SENT" as const }] : [];
    }),
  });

  console.log("Summary");
  console.table({
    matchmakers: await prisma.matchmaker.count(),
    clients: await prisma.profile.count({ where: { isClient: true } }),
    poolProfiles: await prisma.profile.count({ where: { isClient: false } }),
    matches: await prisma.match.count(),
    matchesSent: await prisma.match.count({ where: { status: { in: ["SENT", "ACCEPTED", "DECLINED"] } } }),
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
