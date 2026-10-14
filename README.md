# THEDATECREW — Matchmaker Dashboard

An internal tool for TDC matchmakers. You can see your own clients, open a
client's full biodata, get a ranked list of suggested matches with the reason
behind every score, and send a match across.

Built for the Full Stack Developer Internship assignment.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 7 with
Neon Postgres · zod · Vitest · deployed on Vercel.

## Login

Any of these three work, same password for all. Each one has 26 clients of
their own, and a matchmaker can only see their own list.

| Email | Password |
|---|---|
| `harshit@thedatingcompany.in` | `matchmaker123` |
| `ritika@thedatingcompany.in` | `matchmaker123` |
| `dev@thedatingcompany.in` | `matchmaker123` |

The pool has 300 verified profiles (150 male, 150 female) on top of the 78
clients, so there is always something to match against.

## The thinking behind it

**Tech choices.** Next.js 16 on the App Router, because Server Components let
a page read from the database directly and Server Actions let a form write
back, so there is no REST layer in the middle that has to be kept in sync with
the UI. Postgres on Neon rather than static JSON — the moment you have
matchmakers who must only see their own clients, an audit trail, and a pipeline
that actually moves, you want real constraints and transactions instead of a
file. Prisma carries types from the schema up into the components, Tailwind v4
does the styling, Vitest covers the engine. The whole thing deploys to Vercel
as one unit.

**Matching logic.** Two stages, kept apart on purpose. First Postgres rules out
anyone who is a non-starter: wrong gender, unverified, outside the stated age
or height range, a religion or caste the client did not agree to, a marital
status they ruled out, the opposite answer on children, and same gotra where
both sides are Hindu, since sagotra marriage is not done. Whoever survives is
scored out of 100 across eleven factors, weighted by gender:

- **Male client** — age 20, kids 18, income 14, height 12, values 10,
  relocation 10, lifestyle 8, language 4, location 4
- **Female client** — education 15, career 15, values 15, kids 15,
  relocation 12, lifestyle 10, age 8, language 5, location 5

For a male client the brief's four rules carry 64 of the 100 marks between
them; for a female client the weight moves to profession, education, values and
relocation. Every factor hands back a sentence along with its number, which is
what the score breakdown on each card is showing — a matchmaker is never asked
to trust a figure she cannot interrogate. One refinement of my own: a
preference the client has actually typed in, such as a city or a mother tongue,
is weighted higher than one we infer from her own biodata. The engine is pure
and lives in `src/lib/matching`, so all of it is unit tested.

**How AI is used.** The model refines, it does not decide. Candidates go to it
with names and contact details stripped out, and it returns a tier, up to three
reasons and one honest concern for each. It may move a tier by one band but
never invert it — I added that bound after watching it mark a 93 as Low while
leaving an 86 at Worth Exploring, on a relocation objection the engine had
already scored correctly. The second use is the intro email behind Send Match,
drafted by the model and editable before anything goes out. If the key is
missing or the model times out, nothing breaks: the cards fall back to
rule-based tiers and reasons, and the UI says that is what happened.

**Assumptions.** A matchmaker only ever sees her own clients, so every query is
scoped to her, while the pool of 300 profiles is shared across the firm — which
is why a card will tell you a candidate is already in play with someone else.
The match email goes to the client, not to the candidate; the candidate is
never contacted and never learns she was suggested. Soft preferences such as
city and diet shape the score but do not filter, otherwise a client with
specific tastes lands on an empty page. Manglik is shown only on Hindu
profiles, and partial manglik is treated as compatible either way, since
astrologers themselves disagree on those charts. Sending is mocked into an
outbox table, as the brief allows, so wiring a real provider later means
draining queued rows rather than touching any of this logic.

## Running it locally

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Then open http://localhost:3000.

**One Neon gotcha** — remove `channel_binding=require` from the connection
strings Neon hands you. Prisma's engine does not support channel binding and
the error it gives you is a misleading `P1001 Can't reach database server`,
which will waste your afternoon.

Also note the database sits in `us-east-2`. From India every query costs around
250 ms of network round trip, so local development feels slower than it is.
Postgres itself is answering in under 2 ms. On a deployed instance this
disappears.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build, runs `prisma generate` first |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | Checks |
| `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:studio` | Database |

## AI provider

`src/lib/ai` talks to any OpenAI-compatible endpoint, so switching provider is
four env vars and no code change.

| | Base URL | Notes |
|---|---|---|
| Groq | `https://api.groq.com/openai/v1` | Currently in use. Fast and a generous free tier. |
| OpenRouter | `https://openrouter.ai/api/v1` | Works too. Free tier is 50 requests a day. |

## Layout

```
src/app         routes
src/features    customers, matches, notes, audit — each with repo/service/components
src/lib         matching engine, ai, db, auth, env
src/components  shared UI
prisma          schema, migrations, seed
tests           unit tests for the matching engine
```
