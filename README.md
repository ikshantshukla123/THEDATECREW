# THEDATECREW — Matchmaker Dashboard

Internal tool for matchmakers to manage clients, review verified biodata, and
send AI-ranked match suggestions with an explanation for every score.

> Work in progress. The design system, data model and login screen are in
> place; the dashboard, matching engine and AI rerank are next.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 7 +
Neon Postgres · zod · Vitest

## Getting started

```bash
pnpm install
cp .env.example .env     # fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000.

**Neon note:** strip `channel_binding=require` from the connection strings Neon
gives you. Prisma's engine does not support channel binding and fails with a
misleading `P1001 Can't reach database server`.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build (runs `prisma generate` first) |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | Checks |
| `pnpm db:migrate` / `pnpm db:seed` / `pnpm db:studio` | Database |
| `pnpm images` | Convert `assets/raw/` to WebP and regenerate the manifest |

## AI provider

`lib/ai` targets any OpenAI-compatible endpoint, so the provider is four env
vars and no code change:

| | Base URL | Notes |
|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` | Default. Free tier is 50 requests/day. |
| Groq | `https://api.groq.com/openai/v1` | More generous free tier; better for development. |

Leaving `AI_API_KEY` blank is supported — the matching engine falls back to
rule-based tiers and reasons, and the UI says so.

## Layout

```
src/app         routes (login, design tokens)
src/lib         env, db, ai, utils
src/components  providers and shared UI
prisma          schema and migrations
scripts         image pipeline
```
