# THEDATECREW — Matchmaker Dashboard

An internal tool for TDC matchmakers. You can see your own clients, open a
client's full biodata, get a ranked list of suggested matches with the reason
behind every score, and send a match across.

Built for the Full Stack Developer Internship assignment.

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

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 7 with
Neon Postgres · zod · Vitest.

Server Components do the reading, Server Actions do the writing, so there is no
separate API layer to keep in sync.

## How matching works

Two stages. First the database throws out anyone who is a non-starter — wrong
gender, unverified, outside the stated age or height range, wrong religion or
caste, marital status the client did not agree to, opposite answer on children,
and same gotra where both sides are Hindu.

Whoever survives is then scored out of 100 on eleven factors, weighted
differently by gender:

- **Male client** — age 20, kids 18, income 14, height 12, values 10,
  relocation 10, lifestyle 8, language 4, location 4
- **Female client** — education 15, career 15, values 15, kids 15,
  relocation 12, lifestyle 10, age 8, language 5, location 5

Every factor returns a plain-English reason along with its number, which is
what the score breakdown on each card is showing. Preferences the client has
actually typed in — cities, mother tongues, diet — carry extra weight over the
ones we infer from their own biodata.

Engine lives in `src/lib/matching` and is pure, so all of it is unit tested.

## Where AI comes in

Two places, both optional:

1. **Ranking.** The top candidates go to the model with identities stripped
   out, and it returns a tier, up to three reasons and one honest concern per
   person. It can move a tier by one band, not more — the number has a tested
   derivation and the model does not get to contradict it.
2. **Intro emails.** When you hit Send Match, it drafts a short personalised
   note which you can edit before sending.

If the key is missing or the model times out, nothing breaks — the cards fall
back to rule-based tiers and reasons, and the UI tells you that is what
happened.

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
