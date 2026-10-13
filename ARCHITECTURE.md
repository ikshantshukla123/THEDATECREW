# Matchmaker Dashboard — Architecture

Internal tool for TDC matchmakers to manage clients, view verified biodata, track each client's journey, get AI-ranked match suggestions, send matches and keep notes.

This document is the source of truth for how the system is built. Treat every rule marked **Rule** as non-negotiable during implementation.

---

## 1. Goals and non-goals

**Goals**

- Production-grade modular monolith: clean layers, typed end to end, tested core logic.
- Explainable matching: every suggestion shows *why*, with or without the LLM.
- AI that adds value and never breaks the UI (validated output, cached, with fallback).
- Full auditability: every mutation is logged with actor and timestamp.
- One-click deploy to Vercel with Neon Postgres.

**Non-goals (for this version)**

- End-customer facing app (clients never log in).
- Real email delivery (mocked through an outbox table, swappable later).
- Microservices, queues, or a separate backend.

---

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19.3 | UI and backend in one repo, server components, server actions, Vercel-native |
| Language | TypeScript (strict) | End-to-end types from DB to UI |
| Styling | Tailwind CSS v4 + shadcn/ui | Token-driven design system, accessible primitives |
| Database | Neon Postgres (serverless) | Free tier, branching, pooled connections for serverless |
| ORM | Prisma | Typed queries, migrations, seeding |
| Validation | zod | Input validation and LLM output validation share one tool |
| Auth | Custom credentials: bcryptjs + jose (JWT in httpOnly cookie) | Small, edge-compatible, no vendor lock-in |
| AI | `openai` SDK against any OpenAI-compatible endpoint (OpenRouter by default) | Provider-neutral: OpenRouter and Groq both speak this API, so switching is env vars only |
| Charts | Recharts | Simple, composable analytics charts |
| Forms | react-hook-form + zod resolver | Typed forms with shared schemas |
| Toasts | sonner | Lightweight toasts |
| Testing | Vitest (unit), Playwright (optional e2e) | Fast unit tests on the matching engine |
| Seed data | @faker-js/faker + curated Indian datasets | Realistic, deterministic demo data |
| Hosting | Vercel | Live link, preview deploys per branch |
| CI | GitHub Actions | Lint, typecheck, test on every push |

**Next.js 16 notes.** Two things differ from Next 15 and both are load-bearing here:

- **Middleware is now Proxy.** `middleware.ts` → `proxy.ts`, exporting `proxy`. Same API, same edge runtime.
- **Cache Components is deliberately disabled** in `next.config.ts`. Under it, reading `cookies()` outside a `<Suspense>` boundary is a build error, and every route in this app is session-scoped to one matchmaker. There is no static shell to prerender and nothing to cache across requests, so it would add a boundary per route for no gain. `partialPrefetching` depends on it and is therefore off too; `<Link>` still prefetches route payloads by default.

---

## 3. System overview

```
┌──────────────────────┐
│  Matchmaker browser  │
└──────────┬───────────┘
           │ HTTPS (JWT cookie)
┌──────────▼───────────────────────────────────────────────┐
│ Next.js app on Vercel                                    │
│                                                          │
│  proxy.ts       ── verifies session, guards dashboard    │
│                                                          │
│  app/ (pages, layouts, server components)                │
│       │                                                  │
│  features/*/actions.ts   (server actions: auth + zod)    │
│       │                                                  │
│  features/*/service.ts   (business logic, transactions)  │
│       │            │                                     │
│       │      lib/matching  (pure TS, no I/O)             │
│       │      lib/ai        (AI client, prompts, zod)     │
│       │                                                  │
│  features/*/repo.ts      (only place Prisma is called)   │
└───────┬───────────────────────────────┬──────────────────┘
        │                               │
┌───────▼────────┐             ┌────────▼────────┐
│ Neon Postgres  │             │  OpenAI-compat  │
│ (Prisma)       │             │  AI endpoint    │
└────────────────┘             └─────────────────┘
```

---

## 4. Layering rules

Requests flow one way only:

```
page / server action  →  service  →  repository  →  Prisma
                              ↘  lib/matching (pure)
                              ↘  lib/ai (LLM)
```

- **Rule:** Components never import Prisma. Only `repo.ts` files and `lib/db.ts` touch Prisma.
- **Rule:** Server actions do exactly three things: get the session, validate input with zod, call one service function. No business logic.
- **Rule:** Services own transactions. Any mutation writes its `ActivityLog` row inside the same `prisma.$transaction`.
- **Rule:** Every repository query that reads client data takes `matchmakerId` and filters by it. Authorization is enforced at the data layer, not just the UI.
- **Rule:** `lib/matching` is pure: no DB, no network, no `Date.now()` (pass `now` in). This makes it fully unit-testable.
- **Rule:** No PII (name, email, phone, exact DOB) is ever sent to the LLM.

---

## 5. Folder structure

```
matchmaker-dashboard/
├── .github/
│   └── workflows/
│       └── ci.yml                     # lint, typecheck, test, prisma validate
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── index.ts                   # entry: faker.seed(42), creates everything
│       ├── data/
│       │   ├── names.ts               # Indian first/last names by region
│       │   ├── cities.ts              # cities with state
│       │   ├── colleges.ts            # IITs, NITs, DU, BITS, state colleges
│       │   ├── companies.ts           # companies + designations by profession
│       │   └── communities.ts         # religion → castes, mother tongues
│       └── factories/
│           ├── profile.factory.ts     # realistic correlated biodata
│           └── preference.factory.ts
├── public/
│   ├── images/
│   │   ├── avatars/                   # generated profile photos (see UI doc)
│   │   └── brand/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # fonts, Toaster, theme
│   │   ├── globals.css                # design tokens (CSS variables)
│   │   ├── not-found.tsx
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       ├── page.tsx
│   │   │       └── login-form.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx             # sidebar, topbar, mobile bottom nav
│   │       ├── page.tsx               # redirect → /customers
│   │       ├── customers/
│   │       │   ├── page.tsx           # list (server component, searchParams filters)
│   │       │   ├── loading.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx       # detail shell + tabs
│   │       │       ├── loading.tsx
│   │       │       ├── error.tsx
│   │       │       ├── biodata/page.tsx
│   │       │       ├── matches/page.tsx
│   │       │       ├── notes/page.tsx
│   │       │       └── activity/page.tsx
│   │       ├── analytics/
│   │       │   ├── page.tsx
│   │       │   └── loading.tsx
│   │       └── settings/
│   │           └── page.tsx           # matchmaker profile, logout
│   ├── features/
│   │   ├── auth/
│   │   │   ├── actions.ts             # login, logout
│   │   │   ├── service.ts
│   │   │   └── repo.ts
│   │   ├── customers/
│   │   │   ├── actions.ts             # updateStatus, updatePreferences
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   ├── schemas.ts             # zod: filters, status update
│   │   │   └── components/
│   │   │       ├── customer-table.tsx
│   │   │       ├── customer-card.tsx  # mobile list item
│   │   │       ├── customer-filters.tsx
│   │   │       ├── biodata-section.tsx
│   │   │       ├── profile-header.tsx
│   │   │       └── status-select.tsx
│   │   ├── matches/
│   │   │   ├── actions.ts             # generateMatches, sendMatch, skipMatch,
│   │   │   │                            #   saveMatch, updateMatchStatus
│   │   │   ├── service.ts             # orchestrates matching + AI + caching
│   │   │   ├── repo.ts
│   │   │   ├── schemas.ts
│   │   │   └── components/
│   │   │       ├── match-list.tsx
│   │   │       ├── match-card.tsx
│   │   │       ├── match-actions.tsx   # Skip / Save for later / Send Match
│   │   │       ├── score-ring.tsx
│   │   │       ├── tier-badge.tsx
│   │   │       └── send-match-dialog.tsx
│   │   ├── notes/
│   │   │   ├── actions.ts
│   │   │   ├── service.ts
│   │   │   ├── repo.ts
│   │   │   └── components/
│   │   │       ├── note-composer.tsx
│   │   │       └── note-list.tsx
│   │   ├── audit/
│   │   │   ├── service.ts             # log(tx, entry) helper used by all services
│   │   │   ├── repo.ts
│   │   │   └── components/
│   │   │       └── activity-timeline.tsx
│   │   └── analytics/
│   │       ├── service.ts             # aggregate queries
│   │       ├── repo.ts
│   │       └── components/
│   │           ├── kpi-cards.tsx
│   │           ├── pipeline-funnel.tsx
│   │           ├── matches-over-time.tsx
│   │           └── tier-distribution.tsx
│   ├── lib/
│   │   ├── db.ts                      # Prisma singleton
│   │   ├── env.ts                     # zod-validated env vars, fails fast
│   │   ├── errors.ts                  # AppError, NotFoundError, ForbiddenError
│   │   ├── result.ts                  # ActionResult<T> type for server actions
│   │   ├── logger.ts                  # structured console logger
│   │   ├── utils.ts                   # cn(), formatters (₹ lakhs, ft/in, age)
│   │   ├── auth/
│   │   │   ├── session.ts             # createSession, getSession, requireSession
│   │   │   ├── password.ts            # hash, verify (bcryptjs)
│   │   │   └── rate-limit.ts          # DB-backed login attempt limiter
│   │   ├── matching/
│   │   │   ├── index.ts               # rankCandidates(customer, candidates, now)
│   │   │   ├── types.ts
│   │   │   ├── config.ts              # weights per strategy
│   │   │   ├── filters.ts             # builds Prisma where-clause for hard filters
│   │   │   ├── strategies/
│   │   │   │   ├── male.strategy.ts
│   │   │   │   └── female.strategy.ts
│   │   │   ├── factors/               # one file per scoring factor
│   │   │   │   ├── age.ts
│   │   │   │   ├── height.ts
│   │   │   │   ├── income.ts
│   │   │   │   ├── career.ts          # income stability + profession compatibility
│   │   │   │   ├── education.ts
│   │   │   │   ├── kids.ts
│   │   │   │   ├── relocation.ts
│   │   │   │   ├── values.ts
│   │   │   │   ├── lifestyle.ts
│   │   │   │   ├── language.ts
│   │   │   │   └── location.ts
│   │   │   ├── tier.ts                # score → rule-based tier (AI fallback)
│   │   │   └── hash.ts                # profile fingerprint for cache invalidation
│   │   └── ai/
│   │       ├── client.ts              # OpenAI-compatible client, timeout
│   │       ├── prompts.ts             # system + user prompt builders
│   │       ├── schemas.ts             # zod schemas for LLM JSON output
│   │       ├── sanitize.ts            # strips PII → anonymised attribute objects
│   │       ├── rank-matches.ts        # batched rerank call
│   │       └── write-intro.ts         # intro email generation
│   ├── components/
│   │   ├── ui/                        # shadcn primitives
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── shared/
│   │       ├── avatar.tsx             # photo with initials fallback
│   │       ├── verified-badge.tsx
│   │       ├── status-badge.tsx
│   │       ├── empty-state.tsx
│   │       └── page-header.tsx
│   ├── types/
│   │   └── index.ts
│   └── proxy.ts                        # renamed from middleware.ts in Next 16
├── tests/
│   ├── matching/
│   │   ├── male.strategy.test.ts
│   │   ├── female.strategy.test.ts
│   │   ├── factors.test.ts
│   │   └── fixtures.ts
│   ├── ai/
│   │   └── schemas.test.ts            # malformed LLM output handling
│   └── e2e/                           # optional Playwright
│       └── send-match.spec.ts
├── .env.example
├── .eslintrc / eslint.config.mjs
├── .prettierrc
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md                          # setup, credentials, write-up
```

---

## 6. Data model

### 6.1 Design decisions

- **One `Profile` table for everyone.** Clients and pool profiles share the same biodata. `isClient` + nullable `matchmakerId` distinguish them. A pool profile can become a client without data migration.
- **Preferences are separate** (`PartnerPreference`, 1:1) because they are optional, change often, and are the per-client override of default matching weights.
- **Pipeline is separate** (`CustomerPipeline`, 1:1) so status changes don't touch biodata rows and stay cheap to query for analytics.
- **Money in INR as integers** (annual income in rupees). Height in centimetres. Format only at the UI edge.
- **Enums everywhere a value is closed.** No free-text for marital status, diet, etc.

### 6.2 Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled
  directUrl = env("DIRECT_URL")     // direct, for migrations
}

// ───────── Enums ─────────

enum Gender { MALE FEMALE }

enum MaritalStatus {
  NEVER_MARRIED
  DIVORCED
  AWAITING_DIVORCE
  WIDOWED
  ANNULLED
}

enum YesNoMaybe { YES NO MAYBE }

enum Diet { VEG NON_VEG EGGETARIAN JAIN VEGAN }

enum Habit { NO OCCASIONALLY YES }

enum FamilyType { NUCLEAR JOINT }

enum FamilyValues { TRADITIONAL MODERATE LIBERAL }

enum Manglik { YES NO PARTIAL DONT_KNOW }

enum EducationLevel { DIPLOMA BACHELORS MASTERS DOCTORATE }

enum ProfileCreatedBy { SELF PARENT SIBLING RELATIVE FRIEND }

enum PipelineStatus {
  NEW
  VERIFIED
  SHORTLISTING
  MATCH_SENT
  MEETING_SCHEDULED
  ON_HOLD
  MATCHED
  CLOSED
}

enum MatchStatus {
  SUGGESTED   // produced by the engine, not yet acted on
  SAVED       // matchmaker saved it for later; pinned to the top, never auto-dropped
  SKIPPED     // matchmaker passed on it; excluded from future regeneration
  SENT        // intro sent to the client
  ACCEPTED    // the client said yes
  DECLINED    // the client said no
}

enum MatchTier { HIGH_POTENTIAL GOOD WORTH_EXPLORING LOW }

enum NoteType { CALL MEETING GENERAL }

enum OutboxStatus { QUEUED SENT FAILED }

enum ActivityType {
  STATUS_CHANGED
  NOTE_ADDED
  MATCHES_GENERATED
  MATCH_SENT
  MATCH_SKIPPED
  MATCH_SAVED
  MATCH_STATUS_CHANGED
  PREFERENCES_UPDATED
  CONTACT_REVEALED
}

// ───────── Models ─────────

model Matchmaker {
  id           String        @id @default(cuid())
  name         String
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())

  clients      Profile[]
  notes        Note[]
  activities   ActivityLog[]
}

model Profile {
  id               String           @id @default(cuid())

  // Identity
  firstName        String
  lastName         String
  gender           Gender
  dateOfBirth      DateTime
  photoUrl         String?
  about            String?
  profileCreatedBy ProfileCreatedBy @default(SELF)
  isVerified       Boolean          @default(false)

  // Location
  country          String           @default("India")
  state            String?
  city             String
  heightCm         Int

  // Contact (never sent to the LLM)
  email            String           @unique
  phone            String

  // Education and career
  undergradCollege String
  degree           String
  highestEducation EducationLevel
  annualIncome     Int              // INR per year
  company          String?
  designation      String?

  // Background
  maritalStatus    MaritalStatus
  languages        String[]
  motherTongue     String
  religion         String
  caste            String?
  subCaste         String?
  gotra            String?
  manglik          Manglik          @default(DONT_KNOW)
  brothers         Int              @default(0)
  sisters          Int              @default(0)
  familyType       FamilyType
  familyValues     FamilyValues
  fatherOccupation String?
  motherOccupation String?

  // Lifestyle and intent
  diet             Diet
  smoking          Habit            @default(NO)
  drinking         Habit            @default(NO)
  wantKids         YesNoMaybe
  openToRelocate   YesNoMaybe
  openToPets       YesNoMaybe

  // Client fields
  isClient         Boolean          @default(false)
  matchmakerId     String?
  matchmaker       Matchmaker?      @relation(fields: [matchmakerId], references: [id])

  preference       PartnerPreference?
  pipeline         CustomerPipeline?
  matchesAsClient    Match[]        @relation("ClientMatches")
  matchesAsCandidate Match[]        @relation("CandidateMatches")
  notes            Note[]
  activities       ActivityLog[]

  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([gender, isClient])
  @@index([dateOfBirth])
  @@index([religion])
  @@index([city])
  @@index([matchmakerId])
}

model PartnerPreference {
  id               String       @id @default(cuid())
  profileId        String       @unique
  profile          Profile      @relation(fields: [profileId], references: [id], onDelete: Cascade)

  minAge           Int?
  maxAge           Int?
  minHeightCm      Int?
  maxHeightCm      Int?
  minIncome        Int?
  religions        String[]     // empty = any
  castes           String[]     // ignored when casteNoBar = true
  casteNoBar       Boolean      @default(true)
  motherTongues    String[]
  cities           String[]
  diets            Diet[]
  acceptDivorced   Boolean      @default(false)
  manglikMatters   Boolean      @default(false)

  // Optional per-client weight overrides, e.g. { "income": 0 }
  weightOverrides  Json?

  updatedAt        DateTime     @updatedAt
}

model CustomerPipeline {
  id               String         @id @default(cuid())
  profileId        String         @unique
  profile          Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)
  status           PipelineStatus @default(NEW)
  lastContactAt    DateTime?
  updatedAt        DateTime       @updatedAt

  @@index([status])
}

model Match {
  id            String      @id @default(cuid())
  clientId      String
  client        Profile     @relation("ClientMatches", fields: [clientId], references: [id], onDelete: Cascade)
  candidateId   String
  candidate     Profile     @relation("CandidateMatches", fields: [candidateId], references: [id], onDelete: Cascade)

  ruleScore     Int                 // 0–100 from deterministic engine
  ruleBreakdown Json                // [{ factor, score, weight, reason }]
  aiTier        MatchTier?
  aiReasons     Json?               // string[]
  aiConcern     String?
  aiModel       String?
  pairHash      String              // fingerprint of both profiles' relevant fields

  status        MatchStatus @default(SUGGESTED)
  introSubject  String?
  introBody     String?
  sentAt        DateTime?

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  outbox        EmailOutbox[]

  @@unique([clientId, candidateId])
  @@index([clientId, ruleScore])
  @@index([status, sentAt])
}

model EmailOutbox {
  id        String       @id @default(cuid())
  matchId   String
  match     Match        @relation(fields: [matchId], references: [id], onDelete: Cascade)
  to        String
  subject   String
  body      String
  status    OutboxStatus @default(QUEUED)
  createdAt DateTime     @default(now())
}

model Note {
  id        String     @id @default(cuid())
  profileId String
  profile   Profile    @relation(fields: [profileId], references: [id], onDelete: Cascade)
  authorId  String
  author    Matchmaker @relation(fields: [authorId], references: [id])
  type      NoteType   @default(GENERAL)
  body      String
  createdAt DateTime   @default(now())

  @@index([profileId, createdAt])
}

model ActivityLog {
  id        String       @id @default(cuid())
  actorId   String
  actor     Matchmaker   @relation(fields: [actorId], references: [id])
  profileId String
  profile   Profile      @relation(fields: [profileId], references: [id], onDelete: Cascade)
  type      ActivityType
  payload   Json         // e.g. { from: "NEW", to: "VERIFIED" }
  createdAt DateTime     @default(now())

  @@index([profileId, createdAt])
  @@index([actorId, createdAt])
}

model LoginAttempt {
  id        String   @id @default(cuid())
  email     String
  ip        String?
  success   Boolean
  createdAt DateTime @default(now())

  @@index([email, createdAt])
}
```

---

## 7. Authentication and authorization

**Login flow**

1. `login` server action validates `{ email, password }` with zod.
2. Rate limit: count failed `LoginAttempt` rows for that email in the last 15 minutes; block after 5. (A DB counter works on serverless where in-memory limits don't.)
3. Verify with `bcryptjs.compare`. Record the attempt.
4. On success, sign a JWT with `jose` (`sub = matchmakerId`, `exp = 8h`) and set it as a cookie: `httpOnly`, `secure`, `sameSite=lax`, `path=/`.

**Route protection**

- `src/proxy.ts` verifies the JWT with `jose` (edge-compatible) and redirects to `/login` if it is missing or invalid. **Next 16 renamed Middleware to Proxy** — the file is `proxy.ts`, exporting `proxy` (named or default). Behaviour is otherwise unchanged.
- **Rule:** The matcher cannot reference the `(dashboard)` route group — **route groups are erased from the URL**. The real protected paths are `/`, `/customers`, `/analytics` and `/settings`. Match everything and subtract, so a new route is protected by default rather than exposed by default:

  ```ts
  // src/proxy.ts
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  export async function proxy(request: NextRequest) {
    const token = request.cookies.get('session')?.value
    if (!token || !(await verifyToken(token))) {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  export const config = {
    matcher: [
      // everything except /login, Next internals, and static assets
      '/((?!login|_next/static|_next/image|images|favicon.ico|robots.txt).*)',
    ],
  }
  ```

  A matcher that enumerates protected paths fails open: adding `/reports` later silently ships it unauthenticated.
- **Rule:** Proxy is an **optimistic** guard only — Next's own docs warn against using it as the authorization solution. It keeps unauthenticated users out of the UI; `requireSession()` inside each server action is the real boundary.
- Server actions call `requireSession()` again. Middleware is a UX guard; the action check is the security guard.

**Authorization**

- Every client read/write goes through a repo function that takes `matchmakerId`:
  ```ts
  findClientById(matchmakerId, profileId) // where: { id, isClient: true, matchmakerId }
  ```
- A miss returns `NotFoundError`, not `ForbiddenError`, so IDs of other matchmakers' clients aren't confirmed to exist.

---

## 8. Customer pipeline

Allowed status transitions are enforced in `customers/service.ts`:

```
NEW              → VERIFIED, ON_HOLD, CLOSED
VERIFIED         → SHORTLISTING, ON_HOLD, CLOSED
SHORTLISTING     → MATCH_SENT, ON_HOLD, CLOSED
MATCH_SENT       → MEETING_SCHEDULED, SHORTLISTING, ON_HOLD, CLOSED
MEETING_SCHEDULED→ MATCHED, SHORTLISTING, ON_HOLD, CLOSED
ON_HOLD          → previous active status (stored in ActivityLog payload)
MATCHED          → CLOSED
CLOSED           → (terminal)
```

Sending a match automatically moves `SHORTLISTING → MATCH_SENT`. Every transition writes an `ActivityLog` row with `{ from, to }`.

---

## 9. Matching engine

### 9.1 Pipeline

```
Client profile + preferences
        │
        ▼
Stage 1  Candidate generation (Postgres)      ~150 → ~30
        │  hard filters in the Prisma where-clause
        ▼
Stage 2  Rule scoring (lib/matching, pure TS) ~30 ranked
        │  weighted factors, each with a reason
        ▼
Stage 3  AI rerank (one batched LLM call)     top 10 annotated
        │  tier + reasons + concern, zod-validated
        ▼
Persist to Match table (cached by pairHash)
```

### 9.2 Stage 1 — hard filters

Built by `lib/matching/filters.ts` into a Prisma `where` object:

- Opposite gender, `isClient = false`
- Not already in `Match` for this client with status `SKIPPED`, `SENT`, `ACCEPTED` or `DECLINED`. `SAVED` and `SUGGESTED` rows are *not* excluded — they are re-scored and merged, with `SAVED` pinned to the top of the list.
- Age between `minAge`/`maxAge` (computed as DOB range)
- Height between `minHeightCm`/`maxHeightCm`
- Religion in `religions` (if not empty)
- Caste in `castes` unless `casteNoBar`
- Marital status: `NEVER_MARRIED` only, unless `acceptDivorced`
- Kids dealbreaker: if client says `YES`, exclude candidates with `NO` (and vice versa)
- `isVerified = true` (only verified profiles are suggested)

### 9.3 Stage 2 — weighted scoring

Each factor is a pure function:

```ts
type FactorResult = { score: number; reason: string } // score 0..1

type Factor = (client: MatchProfile, candidate: MatchProfile, ctx: Ctx) => FactorResult
```

Final score: `round(100 × Σ(weightᵢ × scoreᵢ) / Σ weightᵢ)`.

**Strategies and default weights** (`lib/matching/config.ts`)

```ts
export const STRATEGIES = {
  // For male clients — rules from the brief, expressed as tunable weights
  MALE_CLIENT: {
    age:        { weight: 20 }, // candidate younger; sweet spot 1–5 years
    kids:       { weight: 18 }, // same view on children
    income:     { weight: 14 }, // candidate earns ≤ client
    height:     { weight: 12 }, // candidate shorter; sweet spot 5–20 cm
    values:     { weight: 10 },
    relocation: { weight: 10 }, // a practical constraint for both genders
    lifestyle:  { weight: 8 },  // diet, smoking, drinking
    language:   { weight: 4 },
    location:   { weight: 4 },
  },
  // For female clients — compatibility-led
  FEMALE_CLIENT: {
    education:  { weight: 15 }, // candidate at or above client's level
    career:     { weight: 15 }, // income stability, profession compatibility
    values:     { weight: 15 }, // family values + family type
    relocation: { weight: 12 }, // relocation willingness vs. cities
    kids:       { weight: 15 },
    lifestyle:  { weight: 10 },
    age:        { weight: 8 },  // within preferred range, small gap preferred
    language:   { weight: 5 },
    location:   { weight: 5 },
  },
} as const
```

- **Rule:** Every weight key must map to a factor module in `factors/`, and every factor module must be referenced by at least one strategy. Enforce this with a `satisfies Record<FactorName, { weight: number }>` on each strategy so a typo or a missing file is a **compile error**, not a silently dropped factor.
- **Rule:** Each strategy's weights sum to exactly 100. A unit test asserts this, so rebalancing one factor forces an explicit decision about another. (Scoring normalises by `Σ weights` anyway, so this is a readability contract, not a maths requirement.)

`PartnerPreference.weightOverrides` is merged on top, so a matchmaker can, for example, set income weight to 0 for a client who doesn't care about it. This is what makes the gender-specific defaults scalable rather than hardcoded.

**Factor examples**

| Factor | Scoring | Reason example |
|---|---|---|
| age (male client) | 1.0 if candidate 1–5 yrs younger, decays outside, 0.2 if older | "3 years younger" |
| height (male client) | 1.0 if 5–20 cm shorter, partial if 0–5, low if taller | "8 cm shorter" |
| income (male client) | 1.0 if ≤ client, decays as it exceeds | "Earns less than him" |
| kids | 1.0 same, 0.6 one side MAYBE, 0 opposite | "Both want children" |
| education (female client) | 1.0 if ≥ her level, 0.5 one below | "Both hold master's degrees" |
| career (female client) | Blend of income stability (band ≥ hers) and profession compatibility | "Senior engineer, comparable earning band" |
| relocation | 1.0 if same city or either open, 0.3 if both NO and different cities | "He is open to relocating to Pune" |
| values | 1.0 same family values, 0.6 adjacent, 0.2 opposite; +bonus same family type | "Both from moderate nuclear families" |
| lifestyle | average of diet compatibility, smoking, drinking | "Both vegetarian, non-smokers" |

`tier.ts` maps the rule score to a fallback tier: ≥80 High Potential, ≥65 Good, ≥50 Worth Exploring, else Low.

### 9.4 Stage 3 — AI rerank

See section 10.

### 9.5 Caching and regeneration

- `pairHash = sha256(JSON of matching-relevant fields of client + candidate + preferences)`.
- When the matches tab loads: if `Match` rows exist and every `pairHash` still matches, serve from DB with no recomputation and no LLM call.
- If preferences or biodata changed, the hash differs → recompute that client's suggestions.
- A "Refresh matches" button forces regeneration (and is logged as `MATCHES_GENERATED`).

### 9.6 Match lifecycle

```
          ┌──────────── SAVED ◄──────┐
          │              │           │ save
          ▼              ▼           │
      SKIPPED        SUGGESTED ──────┘
       (end)             │
                         │ send
                         ▼
                       SENT ──► ACCEPTED (end)
                         │
                         └────► DECLINED (end)
```

- `SUGGESTED → SKIPPED` — matchmaker passed. Terminal: the candidate is excluded from this client's future regenerations and logged as `MATCH_SKIPPED`.
- `SUGGESTED ⇄ SAVED` — "Save for later". Not terminal and **not** excluded from regeneration; the row is re-scored on refresh and pinned to the top of the list. Logged as `MATCH_SAVED`.
- `SUGGESTED | SAVED → SENT` — see section 11.
- `SENT → ACCEPTED | DECLINED` — the client's answer, recorded by the matchmaker. Both terminal.

**Rule:** Regeneration is an **upsert** on `@@unique([clientId, candidateId])`, never a delete-and-insert — a `SENT` or `SKIPPED` row must survive a refresh. Only rows currently in `SUGGESTED` or `SAVED` have their score, breakdown, tier and `pairHash` overwritten.

---

## 10. AI layer (provider-neutral, OpenAI-compatible)

### 10.1 Uses

| Use | Model class | Output |
|---|---|---|
| Match rerank + explanation | Larger reasoning model | Per candidate: tier, ≤3 reasons, 1 concern |
| Intro email | Small fast model | Subject + 90–120 word personalised intro |

**Rule: no provider SDK.** `lib/ai/client.ts` is the `openai` SDK pointed at `AI_BASE_URL`. OpenRouter and Groq both implement the OpenAI chat-completions API, so the provider is four env vars (`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL_REASONING`, `AI_MODEL_FAST`) and no code change. This is not hypothetical portability — it is operationally necessary:

| Provider | Free tier | Role |
|---|---|---|
| OpenRouter | **50 requests/day** on `:free` models | Default. Model selection and the demo. |
| Groq | far more generous | Development, where constant regeneration exhausts 50/day quickly. |

Only four OpenRouter `:free` models support strict structured outputs. Measured defaults: `nvidia/nemotron-3-super-120b-a12b:free` for rerank (262k context, tools, strict JSON) and `google/gemma-4-26b-a4b-it:free` for intro emails.

### 10.2 Privacy: sanitize before prompting

`lib/ai/sanitize.ts` converts a profile into an anonymous attribute object:

```ts
{
  ref: "C3",                  // short handle, mapped back server-side
  age: 29, heightCm: 165,
  city: "Pune", relocate: "MAYBE",
  education: "MASTERS", degree: "MBA", profession: "Product Manager",
  incomeBand: "15-25L",       // bands, not exact numbers
  religion: "Hindu", motherTongue: "Marathi",
  familyValues: "MODERATE", familyType: "NUCLEAR",
  diet: "VEG", smoking: "NO", drinking: "OCCASIONALLY",
  wantKids: "YES", pets: "MAYBE",
}
```

No names, email, phone, exact DOB, college names or company names.

### 10.3 Batched rerank call

One request for all top-10 candidates (free-tier rate limits make per-candidate calls a bad idea).

- `response_format: { type: "json_schema", json_schema: { strict: true, ... } }` where the model supports it — measured: strict mode enforced the 3-reason cap that a plain `json_object` prompt did not. Fall back to `{ type: "json_object" }` on models without structured-output support; the zod layer below covers both.
- System prompt: role as an experienced Indian matchmaker, instructions to weigh long-term compatibility, be honest about concerns, output strict JSON.
- User prompt: client attributes, client preferences, rule score + breakdown per candidate, candidate attributes.

Output schema (`lib/ai/schemas.ts`):

```ts
export const RankedMatchSchema = z.object({
  ref: z.string(),
  tier: z.enum(["HIGH_POTENTIAL", "GOOD", "WORTH_EXPLORING", "LOW"]),
  reasons: z.array(z.string().max(140)).min(1).max(3),
  concern: z.string().max(140).nullable(),
})

export const RankResponseSchema = z.object({
  matches: z.array(RankedMatchSchema),
})
```

**Rule: clamp cosmetic limits, reject semantic ones.** `tier` and `ref` are validated strictly — a bad enum or unknown ref is a real error. But `reasons` length and string length are **`.transform()`-clamped, not `.max()`-rejected**. Measured: a model returned 7 good reasons and a 190-character concern; rejecting the whole batch over that would have discarded a perfectly usable ranking and fallen back to rule-only output for no user-visible benefit.

### 10.4 Reliability

- **Timeout: 60 s.** Measured: a 10-candidate batch on a free OpenRouter model took **20.2 s** (1122 in / 2086 out tokens). The originally planned 15 s times out before the response lands.
- Retry: once on network error or invalid JSON / zod failure.
- **Fallback:** if the provider still fails, return rule-score tiers and rule reasons, and show a subtle "AI insights unavailable, showing rule-based ranking" note. The page never errors because of the LLM.
- Unknown `ref` values in the response are dropped; missing candidates fall back to rule output.
- Log model, latency and token usage via `lib/logger.ts`.

### 10.5 Intro email

Input: sanitized client + candidate, top AI reasons, matchmaker's first name. Output schema `{ subject, body }`, body 90–120 words, warm and respectful, no exaggeration, ends with a soft next step ("Would you like me to set up a call?"). The matchmaker can edit before sending.

---

## 11. Send Match flow

```
Matchmaker clicks "Send Match"
        │
        ▼
send-match-dialog opens → calls generateIntro action
        │                 (cached on Match.introBody if already generated)
        ▼
Preview: candidate summary card + editable subject/body
        │
        ▼
Confirm → sendMatch action
        │
        ▼
prisma.$transaction:
  1. Match.status = SENT, sentAt = now, intro saved
  2. EmailOutbox row (to = client email, QUEUED → SENT in mock)
  3. CustomerPipeline: SHORTLISTING → MATCH_SENT (if applicable)
  4. ActivityLog: MATCH_SENT { candidateId, tier }
        │
        ▼
revalidatePath(customer page) → toast "Match sent to Priya"
```

Swapping the mock for real email later: a worker (or Resend call after the transaction) reads `QUEUED` outbox rows. That is the outbox pattern, so the mutation and the email can never disagree.

---

## 12. Notes and activity

- Notes: typed (`CALL`, `MEETING`, `GENERAL`), reverse-chronological, author + relative time. Adding a call/meeting note updates `CustomerPipeline.lastContactAt`.
- Activity timeline: merges `ActivityLog` entries into a single feed per client, rendered with a human sentence per type ("Harshit moved Priya from Verified to Shortlisting").

`features/audit/service.ts`:

```ts
export function logActivity(tx: Prisma.TransactionClient, entry: {
  actorId: string; profileId: string; type: ActivityType; payload: object
}) {
  return tx.activityLog.create({ data: entry })
}
```

Every service that mutates calls this with the transaction client, so the log can't drift from the data.

---

## 13. Analytics

All server-side aggregate queries scoped to the logged-in matchmaker:

| Widget | Query |
|---|---|
| KPI cards | total clients, active (not CLOSED), matches sent this week, meetings scheduled |
| Pipeline funnel | `customerPipeline.groupBy({ by: ['status'] })` |
| Matches sent over time | `Match` where `status in [SENT, ACCEPTED, DECLINED]`, grouped by week (`date_trunc` via `$queryRaw`) |
| Tier distribution | `match.groupBy({ by: ['aiTier'] })` for sent matches |
| Acceptance rate | accepted / (accepted + declined) |
| Clients needing attention | `lastContactAt` older than 14 days and status active |

Render with Recharts in client components; data comes from the server component page.

---

## 14. Error handling and logging

- `lib/errors.ts`: `AppError` (base, with `code` and safe `message`), `NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError`.
- Server actions return a discriminated union, never throw to the client:
  ```ts
  type ActionResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }
  ```
- Route-level `error.tsx` boundaries for unexpected failures, `loading.tsx` skeletons for every data route.
- `lib/logger.ts`: structured JSON logs (`level`, `event`, `durationMs`, `matchmakerId`); visible in Vercel logs. Never log PII or prompt contents with contact details.

---

## 15. Security checklist

- [ ] Passwords hashed with bcryptjs (cost 10+)
- [ ] JWT secret ≥ 32 random bytes, in env only
- [ ] Cookies `httpOnly`, `secure`, `sameSite=lax`
- [ ] Session checked in `proxy.ts` **and** every server action
- [ ] All client queries scoped by `matchmakerId`
- [ ] zod validation on every action input
- [ ] Login rate limiting
- [ ] No PII sent to the LLM; income sent as bands
- [ ] LLM output treated as untrusted: zod-validated, rendered as text (no `dangerouslySetInnerHTML`)
- [ ] `env.ts` fails the build if required env vars are missing
- [ ] Security headers in `next.config.ts` (X-Frame-Options, Referrer-Policy, basic CSP)

---

## 16. Performance

- Server components for all data fetching; client components only for interactivity.
- Customer list: server-side pagination (20 per page) and filters via `searchParams`.
- Select only needed columns in list queries (`select`, not full rows).
- Matches tab streams with `<Suspense>`: rule-scored list renders immediately, AI annotations stream in.
- `next/image` for every photo with fixed aspect ratio and blur placeholders.
- Prisma singleton in `lib/db.ts` to avoid connection exhaustion in dev.

---

## 17. Environment variables

`.env.example`:

```bash
# Neon — pooled connection for the app, direct for migrations
# Strip `channel_binding=require` from Neon's copied strings — Prisma's engine
# does not support channel binding and fails to connect with P1001.
DATABASE_URL="postgresql://USER:PASS@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASS@HOST.REGION.aws.neon.tech/DB?sslmode=require"

# Auth
AUTH_SECRET="generate-with-openssl-rand-base64-32"

# AI — any OpenAI-compatible endpoint. Optional: blank AI_API_KEY runs the
# rule-based fallback path, which is how you demonstrate it.
#   OpenRouter  https://openrouter.ai/api/v1   (default; 50 req/day free tier)
#   Groq        https://api.groq.com/openai/v1 (better for dev iteration)
AI_BASE_URL="https://openrouter.ai/api/v1"
AI_API_KEY=""
AI_MODEL_REASONING="nvidia/nemotron-3-super-120b-a12b:free"
AI_MODEL_FAST="google/gemma-4-26b-a4b-it:free"

# App
APP_URL="http://localhost:3000"
```

---

## 18. Seed data

`prisma/seed/index.ts`:

- `faker.seed(42)` so the dataset is identical on every reseed (stable demo).
- 3 matchmakers with known credentials (documented in README).
- ~40 clients (mixed gender) split across matchmakers, each with preferences and a pipeline status spread across all stages.
- ~150 pool profiles per gender (300 total), all verified.
- **Correlated, realistic data:** income follows designation and city; IIT/NIT graduates skew to tech roles; mother tongue follows state; caste lists follow religion; age correlates with seniority.
- A few pre-sent matches, notes and activity rows so analytics and timelines aren't empty on first login.

Scripts:

```json
{
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:seed": "tsx prisma/seed/index.ts",
  "db:reset": "prisma migrate reset --force"
}
```

---

## 19. Testing

| Layer | What | Tool |
|---|---|---|
| Matching factors | Each factor's edge cases (equal age, taller candidate, MAYBE kids) | Vitest |
| Strategies | Fixture clients produce expected ordering; overrides change ranking | Vitest |
| Filters | Generated `where` clause for preference combinations | Vitest |
| AI schemas | Malformed / partial / extra-field JSON handled; fallback path | Vitest |
| Strategy weights | Each strategy's weights sum to 100; every key has a factor module | Vitest |
| Match lifecycle | Regeneration upserts: `SENT` and `SKIPPED` rows survive a refresh; `SAVED` is re-scored and pinned | Vitest |
| Send match | Login → open client → send match → toast + timeline entry | Playwright (optional) |

Target: matching engine fully covered; it's the core of the evaluation.

---

## 20. CI and deployment

**GitHub Actions (`ci.yml`)** on every push and PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm prisma validate && pnpm prisma generate`
3. `pnpm lint`
4. `pnpm typecheck` (`tsc --noEmit`)
5. `pnpm test`

**Vercel**

- Build command: `prisma generate && prisma migrate deploy && next build`
- Env vars set in the Vercel dashboard for Production and Preview.
- Neon: use a separate branch database for Preview deployments if you want isolated testing.
- Seed production once from local: `DATABASE_URL=<prod> pnpm db:seed`.

---

## 21. Build order

| # | Milestone | Done when |
|---|---|---|
| 1 | Repo, tooling, Neon, Prisma schema, seed | `pnpm db:seed` produces realistic data |
| 2 | Auth + proxy | Login works, dashboard protected |
| 3 | Deploy to Vercel | Live link works with login (deploy early) |
| 4 | Customer list + detail (biodata tab) | Filters, search, pagination, full biodata |
| 5 | Matching engine + tests | Ranked list with rule reasons, tests green |
| 6 | AI rerank + caching + fallback | Tiers and explanations, no repeat LLM calls |
| 7 | Send Match flow | Intro preview, outbox, status change, toast |
| 8 | Notes + status changes + activity timeline | Every mutation visible in timeline |
| 9 | Analytics page | Funnel, trends, tiers, attention list |
| 10 | Polish | Empty/loading/error states, mobile, a11y pass |
| 11 | README + write-up | Credentials, architecture summary, assumptions |

---

## 22. Assumptions (for the write-up)

- Matchmakers are internal staff; clients never log in.
- Only verified profiles are suggested as matches.
- The brief's male-client rules are implemented as default weights, overridable per client.
- Caste and religion filters apply only when the client sets them; "caste no bar" is the default.
- Income is annual, in INR; shared with the LLM only as a band.
- Emails are mocked via an outbox table; the design supports real delivery without changing the send flow.
- Profile photos are generated or licensed images, not real people's photos.
