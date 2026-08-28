# NihonGo — AI-powered Japanese language-school interview practice

**NihonGo** is an AI-powered Japanese language-school interview practice system. It is the working product for:

- **CSC 485** Introduction to Research Methodology for Computer Science — research the problem, review related work, define the research question, choose a method, consider ethics, and evaluate usefulness.
- **CSC 492** Computer Science Project — build, test, deploy, document, defend (oral examination), and present the web application.

A student joins a 3-question mock admission interview with Tanaka-sensei, answers by voice or type, and sees an Interview Readiness report.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed on Netlify.
No database, no auth. Vitest for unit tests.

## Setup

```bash
npm install
cp .env.example .env.local
# Each key is scoped to one purpose only — see .env.example for details:
#   ELEVENLABS_TTS_API_KEY, ELEVENLABS_SCRIBE_API_KEY,
#   GROQ_TRANSLATE_API_KEY, GROQ_GRADE_API_KEY, N8N_WEBHOOK_URL
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
see `scripts/check-env.mjs` and `lib/server/env/`.

Presentation demo path: `/?pitch=1` (canned EN/MY captions and canned last-screen swap when the live headline is not Ready). Used for the CSC 492 oral exam / final presentation, not a separate product.

## Project layout

```text
app/              Next.js App Router routes (pages + API route handlers)
lib/server/       Server-only modules (env access, etc.) — never imported client-side
scripts/          Build-time checks (env validation)
docs/             Generated n8n rubric snapshot (docs/rubric-generated.md)
mocks/            Shared JSON fixtures (e.g. sample-report-ready.json)
```

## Deploy contingency (Issue 15)

Primary host is Netlify with the Next.js runtime. If that adapter blocks deploy, switch the UI to Vite + React + TS + Tailwind on Netlify and keep Netlify Functions for ElevenLabs and other key-bearing routes. Do not implement that fallback unless the Next.js adapter actually fails.
