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
- Testing: Vitest + `@testing-library/react` + `jsdom` (`npm test`)

---

## Folder Structure
```text
app/                          Next.js App Router routes + API route handlers
  page.tsx                    Issue 3 start screen (splash, ProfileCard, Join, desktop-only gate)
  components/ProfileCard.tsx  read-only student profile card (Issue 3)
  call/                       Issue 4-5 call screen (client component tree)
    page.tsx                  wires tiles + hooks + n8n warm ping + Q1 auto-play
    SenseiTile.tsx            static sensei tile (image + label)
    StudentTile.tsx           camera feed / placeholder + mic/camera toggles
    useCameraStream.ts        camera permission + srcObject wiring hook
    useMicToggle.ts           mic on/off state hook
    useQuestionFlow.ts        Q1 → Q2 → Q3 → done state machine (Issue 5)
    playQuestionAudio.ts      client audio player pointed at /api/tts (Issue 5)
  api/
    health/route.ts           trivial health check
    tts/                      Issue 5 TTS proxy
      route.ts                thin route handler
      resolveQuestionAudio.ts pure race function: ElevenLabs vs 1.5s timeout → fallback
    warm-n8n/                 Issue 5 fire-and-forget grading-workflow warm ping
      route.ts                thin route handler
      pingN8n.ts              POST helper that swallows all errors
lib/
  server/                     server-only modules, secrets — never imported client-side
    env/                      one file per purpose; each requires only its own key at import
      requireEnv.ts           shared throw-if-missing helper
      elevenlabsTts.ts        getElevenLabsTtsKey (Issue 5)
      elevenlabsScribe.ts     getElevenLabsScribeKey (Issue 9)
      geminiTranslate.ts      getGeminiTranslateKey (Issue 8)
      geminiGrade.ts          getGeminiGradeKey (Issue 11 fallback)
      n8n.ts                  getN8nWebhookUrl (Issues 5, 11)
      wispr.ts                getWisprKey (Issue 7, optional — no requireEnv)
  content/                    non-secret locked data + pure logic, safe client-or-server
    profile.ts                Aung Min Khant's locked profile + DISPLAY_CARD_FIELDS
    questions.ts              Tanaka-sensei's 3 questions (JA/EN/MY, always shown)
    pitchAnswers.ts           student's 3 locked pitch-mode phone-clip answers (JA/EN/MY, by index)
    rubric.ts                 getRubricPrompt, parseRawScores, scoreReport, getRubricDoc
public/
  tanaka-sensei.png           sensei tile image
  question-{1,2,3}.mp3        pre-rendered ElevenLabs Sarah-voice fallbacks (Issue 5)
scripts/
  check-env.mjs               prebuild check — fails the build if a required env var is missing
  generate-fallback-audio.ts  one-off dev script: pre-renders question-N.mp3 via ElevenLabs
                              (excluded from tsc; run via `node --env-file=.env.local`)
docs/
  prd-nihongo.md              product requirements
  issues-nihongo.md           15-issue build plan (vertical slices) — Issues 1-5 ticked
  ubiquitous-language.md      shared domain vocabulary — pass to Claude every session
  rubric-generated.md         snapshot-tested, paste-into-n8n artifact (Gemini prompt + JS scoring snippet)
mocks/
  sample-report-ready.json    dual-grade-failure fallback + ?pitch=1 canned last screen
context.md                    grill-me decision handoff (product scope, locked before PRD)
.cursor/cli.json              denies Read(.env*) so agent never sees raw keys
```

---

## Architecture Rules
- `lib/server/` = secrets, server-only, never imported by a `"use client"` file. `lib/content/` = locked non-secret data/logic, safe to import anywhere.
- Required env vars fail the build at `prebuild` (`scripts/check-env.mjs`) and at module-import time of each per-purpose `lib/server/env/<purpose>.ts` sub-module — never lazily inside a request handler, and never coupled across purposes (a missing Scribe key must not break the TTS route).
- One API key per purpose. Even when two features hit the same provider (e.g. ElevenLabs TTS + Scribe, Gemini translate + grade), they use separately-scoped keys in different env vars, exposed via different `lib/server/env/*` modules. Never import a "combined env" barrel — always import the specific getter you need.
- Route handlers stay thin. All non-trivial logic (race/timeout/fallback for TTS, fire-and-forget error swallowing for n8n) lives in a tested helper module beside `route.ts`; the handler is just glue that injects real dependencies (fetch, fs) into the helper.
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
- **One API key per purpose**: ElevenLabs and Gemini keys are split by feature (TTS vs Scribe, translate vs grade). This limits blast radius on key compromise and lets us scope permissions per key at the provider level.
- **Per-purpose env sub-modules** (`lib/server/env/<purpose>.ts`) instead of a single `env.ts` barrel: this ensures `require("<purpose>")` fails at boot only for the routes that actually need `<purpose>`, keeping otherwise-unrelated routes bootable in partial dev environments. Isolation is tested via `lib/server/env/env.test.ts`.
- **Server owns the TTS race** (Issue 5, Approach C): `/api/tts` races live ElevenLabs against a 1.5s timeout and serves the local `.mp3` fallback on timeout or error. The client just plays `/api/tts?questionId=N` and never knows which won. Live and fallback use the same voice (ElevenLabs "Sarah", `EXAVITQu4vr4xnSDxMaL`) so playback is indistinguishable.
- **Agent is denied `Read(.env*)`** via `.cursor/cli.json` so the assistant can never see raw API key values — scripts pass them via `process.env` instead.

---

## Current State
- Issues 1, 2, 3, 4, and 5 (of 15, see `docs/issues-nihongo.md`) are built, tested, committed, and pushed to `origin/main`.
- 55/55 tests passing (Vitest, 20 files). Lint clean. `npm run build` succeeds with required env vars set, fails fast per per-purpose env sub-module without them.
- Working screens: start screen (`/`) with profile card + Join + desktop-only gate; call screen (`/call`) with student/sensei tiles, camera+mic toggles, live ElevenLabs TTS with 1.5s local-mp3 fallback race, fire-and-forget n8n warm ping, Q1→Q2→Q3→done flow.
- **Temporary UI**: `/call` has a placeholder "Submit answer" button because real answer capture (Wispr/browser speech / "Type instead") is Issue 7. Click it to advance through Q2 → Q3 → "Interview complete" manually.
- Report screen does not exist yet (Issue 13).
- Not deployed to Netlify yet.
- Only `ELEVENLABS_TTS_API_KEY` is filled in `.env.local`; other keys (Scribe, translate, grade, n8n webhook) are still placeholders — that's fine because the env sub-modules only require what each route uses, and no other routes exist yet.
- Latest commit: `08e18ef` ("Build question flow, TTS route with fallback race, and n8n warm ping (Issue 5)").

---

## Open Tasks
Next: **Issue 6 — Language HUD (captions, waveform switching)**, then in order per `docs/issues-nihongo.md`:
1. Issue 6 — Language HUD (captions, waveform switching)
2. Issue 7 — Student voice/type input (Wispr/browser fallback + "Type instead") — also replaces the temporary "Submit answer" button on `/call`
3. Issues 8-10 (parallel) — `/api/translate`, Scribe, sidebar (fill `GEMINI_TRANSLATE_API_KEY` and `ELEVENLABS_SCRIBE_API_KEY` in `.env.local` before starting each)
4. Issue 11 — Grading (n8n + `/api/grade` fallback) — fill `N8N_WEBHOOK_URL` and `GEMINI_GRADE_API_KEY` in `.env.local` first
5. Issue 12 — Dual-grade failure fallback
6. Issue 13 — Practice report screen (radar, stamp, coaching)
7. Issue 14 — Pitch mode (`?pitch=1`)
8. Issue 15 — Netlify deploy + env wiring (can start any time)

Also open:
- Get a native Burmese speaker to review translation text before event day (29 Aug).
- Set `N8N_WEBHOOK_URL` in `.env.local` before Issue 11 so the fire-and-forget warm ping stops returning 500 (currently harmless — client swallows it).

---

## What NOT to do
- Do not add dependencies before the stack and project direction are clear. *(Superseded for the chosen stack — Next.js/TS/Tailwind/Vitest/Netlify are locked; this still applies to anything not already in `docs/prd-nihongo.md`'s Technical Constraints, e.g. no shadcn/ui, no other component library, no database.)*
- Do not put weights, gate thresholds, or headline logic anywhere other than `lib/content/rubric.ts` — every other consumer (n8n, `/api/grade`) must derive from it, not reimplement it.
- Do not import `lib/server/*` from a `"use client"` file.
- Do not create a combined `lib/server/env.ts` barrel. Each getter lives in its own per-purpose sub-module so a missing key in one purpose can never break another purpose's route.
- Do not reuse an API key across purposes even when it's from the same provider account (ElevenLabs TTS ≠ Scribe, Gemini translate ≠ grade). Create a new scoped key in the provider dashboard and add a matching env var + sub-module.
- Do not merge `questions.ts` and `pitchAnswers.ts` — they model different things (sensei's question vs. student's pitch answer).
- Do not read `.env`/`.env.local` directly. The `.cursor/cli.json` deny rule is there for a reason — the agent should never see raw key values. Pass keys through `process.env` in scripts instead (e.g. `node --env-file=.env.local`).
- Do not overwrite user-created files or uncommitted work without explicit permission. *(Note: this almost happened during the Issue 1 session — `create-next-app` briefly overwrote this file with its own Claude Code pointer stub; caught immediately via `git status` and restored via `git checkout`. Be careful running scaffolding tools inside a repo that already has files.)*
- Do not commit or push without explicit user instruction.

---

## Session Log
| Date | Task completed | Decisions made |
|------|---------------|----------------|
| 2026-08-17 | Initialized project context file | Created a conservative template because the repository is empty |
| 2026-08-18 | Wrote 15-issue build plan from the PRD; built Issue 1 (Next.js/TS/Tailwind scaffold, design tokens, fail-fast env config) and Issue 2 (locked content module: profile, questions, pitchAnswers, rubric/scoring engine) via `/build-plan` → `/design-check` → `/tdd` for each; generated `docs/ubiquitous-language.md` retroactively (Mode B) | App Router over Pages Router for streaming support; scoring math kept as deterministic TS code (not LLM math), shared with n8n via a generated + snapshot-tested paste artifact; sensei question translations and student pitch-answer translations kept as separate content modules |
| 2026-08-18 | Built Issue 3 (start screen with ProfileCard + Join + desktop-only gate), Issue 4 (call screen shell with student/sensei tiles + camera/mic hooks), and Issue 5 (useQuestionFlow state machine + `/api/tts` route with 1.5s ElevenLabs-vs-local-mp3 race + `/api/warm-n8n` fire-and-forget ping + pre-rendered fallback audio for all 3 questions); verified Issue 1 ACs; refactored `env.ts` twice (first into per-purpose keys, then into per-purpose sub-modules under `lib/server/env/`) to enforce one-key-per-purpose and decouple boot failures across routes | One API key per purpose (never share across features even on the same provider account); per-purpose env sub-modules instead of a barrel so a missing key blocks only its own route; server owns the TTS race (Approach C) with client blind to whether live or fallback won — same voice used for both so playback is indistinguishable; `.cursor/cli.json` denies `Read(.env*)` so the agent never sees raw key values; route handlers stay thin over tested helper modules (`resolveQuestionAudio`, `pingN8n`) |
