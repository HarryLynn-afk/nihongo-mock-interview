# Nihongo Mock Interview (NihonGo)
> Claude reads this file at the start of every session.
> Update this file at the end of every session using /end-session.
> Also read `docs/ubiquitous-language.md` at the start of every session —
> pass it back with: "Here is our ubiquitous language — use these terms
> exactly as defined."

---

## Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS v4
- Backend: Next.js Route Handlers, same codebase (`app/api/*/route.ts`)
- Database: None — explicitly out of scope (no accounts, no persistence)
- Deployment: Netlify (Next.js runtime plugin, `netlify.toml`) — not yet deployed
- Testing: Vitest (`npm test`)

---

## Folder Structure
```text
app/                    Next.js App Router routes + API route handlers
  api/health/route.ts   trivial health check (proves Route Handlers work)
lib/
  server/               server-only modules, secrets — never imported client-side
    env.ts              typed env accessors, fail fast at import/build time
  content/              non-secret locked data + pure logic, safe client-or-server
    profile.ts          Aung Min Khant's locked profile + DISPLAY_CARD_FIELDS
    questions.ts        Tanaka-sensei's 3 questions (JA/EN/MY, always shown)
    pitchAnswers.ts     student's 3 locked pitch-mode phone-clip answers (JA/EN/MY, by index)
    rubric.ts           getRubricPrompt, parseRawScores, scoreReport, getRubricDoc
scripts/
  check-env.mjs         prebuild check — fails the build if a required env var is missing
docs/
  prd-nihongo.md        product requirements
  issues-nihongo.md     15-issue build plan (vertical slices)
  ubiquitous-language.md  shared domain vocabulary — pass to Claude every session
  rubric-generated.md   snapshot-tested, paste-into-n8n artifact (Gemini prompt + JS scoring snippet)
mocks/
  sample-report-ready.json  dual-grade-failure fallback + ?pitch=1 canned last screen
context.md              grill-me decision handoff (product scope, locked before PRD)
```

---

## Architecture Rules
- `lib/server/` = secrets, server-only, never imported by a `"use client"` file. `lib/content/` = locked non-secret data/logic, safe to import anywhere.
- Required env vars fail the build at `prebuild` (`scripts/check-env.mjs`) and at module-import time (`lib/server/env.ts`) — never lazily inside a request handler.
- The rubric (weights, gates, formula, headline table) lives once in `lib/content/rubric.ts`. `getRubricDoc()` generates the paste-into-n8n text from that same source; `lib/content/rubricDoc.test.ts` snapshot-tests it against `docs/rubric-generated.md` so an edit that isn't re-pasted into n8n fails a test instead of drifting live.
- Sensei's question translations (`questions.ts`) and the student's pitch-mode answer translations (`pitchAnswers.ts`) are separate modules — do not merge them, they are different concepts keyed differently (question object vs. `questionIndex`).
- Workflow per issue: `/build-plan` → `/design-check` (if an interface is involved) → `/tdd` (red/green/refactor, one test at a time).
- Domain terminology is locked in `docs/ubiquitous-language.md` — use those exact terms, don't introduce synonyms.

---

## Key Decisions Made
- Product scope, PRD, and the 15-issue build plan are locked (`docs/prd-nihongo.md`, `docs/issues-nihongo.md`) — practice build now, Launch Pack rebuild on 29 Aug event day.
- Next.js App Router chosen over Pages Router (via `/build-plan`) for native streaming support, needed later for the ElevenLabs TTS proxy (Issue 5).
- No database, no accounts — `profile`/`questions`/`pitchAnswers` are hardcoded fixtures, not persisted entities.
- Scoring math is deterministic TypeScript (`scoreReport`), not LLM-computed — the LLM only emits raw 1-5 scores; weights/gates/headline are applied by code, mirrored into n8n via the generated snippet.
- English/Burmese translation text in `questions.ts`/`pitchAnswers.ts` was authored for this build (PRD only locks the Japanese) — **needs native Burmese speaker review before event day**.

---

## Current State
- Issues 1 and 2 (of 15, see `docs/issues-nihongo.md`) are built, tested, committed, and pushed to `origin/main`.
- 24/24 tests passing (Vitest, 9 files). Lint clean. `npm run build` succeeds with required env vars set, fails fast without them.
- No screens exist yet — no start screen, no call UI, no report screen. `app/page.tsx` is still the default Next.js template page.
- Not deployed to Netlify yet.
- Latest commit: `1126e01` ("Add ubiquitous language dictionary").

---

## Open Tasks
Next: **Issue 3 — Start screen (splash, profile card, Join, desktop-only gate)**, then in order per `docs/issues-nihongo.md`:
1. Issue 3 — Start screen
2. Issue 4 — Call UI shell (tiles, camera/mic toggles, dark theme)
3. Issue 5 — Question flow engine + ElevenLabs TTS with local fallback
4. Issue 6 — Language HUD (captions, waveform switching)
5. Issue 7 — Student voice/type input (Wispr/browser fallback + Type instead)
6. Issues 8-10 (parallel) — `/api/translate`, Scribe, sidebar
7. Issue 11 — Grading (n8n + `/api/grade` fallback)
8. Issue 12 — Dual-grade failure fallback
9. Issue 13 — Practice report screen (radar, stamp, coaching)
10. Issue 14 — Pitch mode (`?pitch=1`)
11. Issue 15 — Netlify deploy + env wiring (can start any time after Issue 1)

Also open: get a native Burmese speaker to review translation text before event day (29 Aug).

---

## What NOT to do
- Do not add dependencies before the stack and project direction are clear. *(Superseded for the chosen stack — Next.js/TS/Tailwind/Vitest/Netlify are locked; this still applies to anything not already in `docs/prd-nihongo.md`'s Technical Constraints, e.g. no shadcn/ui, no other component library, no database.)*
- Do not put weights, gate thresholds, or headline logic anywhere other than `lib/content/rubric.ts` — every other consumer (n8n, `/api/grade`) must derive from it, not reimplement it.
- Do not import `lib/server/*` from a `"use client"` file.
- Do not merge `questions.ts` and `pitchAnswers.ts` — they model different things (sensei's question vs. student's pitch answer).
- Do not overwrite user-created files or uncommitted work without explicit permission. *(Note: this almost happened this session — `create-next-app` briefly overwrote this file with its own Claude Code pointer stub; caught immediately via `git status` and restored via `git checkout`. Be careful running scaffolding tools inside a repo that already has files.)*
- Do not commit or push without explicit user instruction.

---

## Session Log
| Date | Task completed | Decisions made |
|------|---------------|----------------|
| 2026-08-17 | Initialized project context file | Created a conservative template because the repository is empty |
| 2026-08-18 | Wrote 15-issue build plan from the PRD; built Issue 1 (Next.js/TS/Tailwind scaffold, design tokens, fail-fast env config) and Issue 2 (locked content module: profile, questions, pitchAnswers, rubric/scoring engine) via `/build-plan` → `/design-check` → `/tdd` for each; generated `docs/ubiquitous-language.md` retroactively (Mode B) | App Router over Pages Router for streaming support; scoring math kept as deterministic TS code (not LLM math), shared with n8n via a generated + snapshot-tested paste artifact; sensei question translations and student pitch-answer translations kept as separate content modules |
