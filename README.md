# NihonGo — Japanese language school interview practice

Practice build for a 3-question mock admission interview with Tanaka-sensei.
See [`docs/prd-nihongo.md`](docs/prd-nihongo.md) for product scope and
[`docs/issues-nihongo.md`](docs/issues-nihongo.md) for the build plan.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed on Netlify.
No database, no auth. Vitest for unit tests.

## Setup

```bash
npm install
cp .env.example .env.local
# Each key is scoped to one purpose only — see .env.example for details:
#   ELEVENLABS_TTS_API_KEY, ELEVENLABS_SCRIBE_API_KEY,
#   GEMINI_TRANSLATE_API_KEY, GEMINI_GRADE_API_KEY, N8N_WEBHOOK_URL
# (WISPR_API_KEY optional)
```

## Run

```bash
npm run dev       # start the dev server at http://localhost:3000
npm test          # run the unit test suite once
npm run test:watch
npm run build     # production build (also runs scripts/check-env.mjs first)
npm run lint
```

`npm run build` fails fast if a required environment variable is missing —
see `scripts/check-env.mjs` and `lib/server/env.ts`.

## Project layout

```text
app/              Next.js App Router routes (pages + API route handlers)
lib/server/       Server-only modules (env access, etc.) — never imported client-side
scripts/          Build-time checks (env validation)
docs/             PRD, issues, and shared rubric source
mocks/            Shared JSON fixtures (e.g. sample-report-ready.json)
```
