# NihonGo — AI-powered Japanese language-school interview practice

**NihonGo** is an AI-powered Japanese language-school interview practice system. It is the working product for:

- **CSC 485** Introduction to Research Methodology for Computer Science — research the problem, review related work, define the research question, choose a method, consider ethics, and evaluate usefulness.
- **CSC 492** Computer Science Project — build, test, deploy, document, defend (oral examination), and present the web application.

This is not a hackathon or event-day demo. The 29 Aug Launch Pack rebuild is void.

A student joins a mock admission interview with Tanaka-sensei (Tokyo Pathway Japanese School), answers **by voice**, and sees an **Interview Readiness** report on `/call` (no `/report` route). Typing is not offered.

- **Guest** (**Try as guest** on `/` → `/call?guest=1`): practice the three locked Questions. Not saved to study sessions.
- **Participant** (`/` or a capped join link → Google sign-in → same landing → **Join interview** → consent → device setup → `/call`): invited tester after Google login and consent this visit. Their name and email appear on `/profile`; the classroom and report show `P001`… instead. Topic bank + follow-ups. Study N.
- **Pitch mode** was removed. `/pitch` and `/call?pitch=1` show the not-found page.

The [participant entry flow](docs/participant-entry-flow.md) records the landing, sign-in, profile, consent, and classroom sequence.

The [lint cleanup checklist](docs/lint-cleanup.md) records the existing code-checker errors and warnings for later work.

On `/call`, Tanaka-sensei plays committed `public/question-{id}.mp3`. The student Speaks Japanese (Deepgram live captions, or browser SpeechRecognition if Deepgram is unset). **Hear again** (speaker left of the Japanese headline) replays the Question while idle or paused. **Answer again** (**1 retry**, left of the mic) is one content redo before Submit, per Question. Empty or no-kana takes get two more Speak attempts, then the Question is skipped. Camera is optional; mic is required.

Do not print N5, JLPT, A1, Pass, or Fail on the splash, call, or report Headline.

## Stack

- **App:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **API:** Next.js Route Handlers (`app/api/*/route.ts`) — keys stay off the client
- **Tests:** Vitest + `@testing-library/react` + `jsdom` (`npm test`)
- **Host:** Netlify (`netlify.toml`) — not deployed yet
- **Grading:** `POST /api/score` → Groq (`qwen/qwen3.8-27b`) → sample InterviewReport if Groq misses. No n8n.
- **Database:** none for Guest. Optional **Supabase** (Postgres) for Participant login, consent, join-links, and full-session requests.

There is no public sign-up. Guest answers are never auto-merged after login.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`. Each key is one purpose — do not reuse a Groq or ElevenLabs key across features. Never commit `.env.local`.

**Required** (build fails without them — `scripts/check-env.mjs`):

| Variable | Purpose |
| --- | --- |
| `GROQ_GRADE_API_KEY` | Interview grading (`/api/score`) |

**Optional:**

| Variable | Purpose |
| --- | --- |
| `ELEVENLABS_TTS_API_KEY` | Generate-time only (`scripts/generate-fallback-audio.ts`). Sensei plays committed `public/question-{id}.mp3` |
| `DEEPGRAM_STT_API_KEY` | Live Japanese captions. Needs a Deepgram **Member** (or higher) key — usage-only keys cannot mint a listen JWT. Missing or 403 fail-opens to browser captions |
| `RESEARCH_FORM_URL` | Help the study after the report (hidden if unset) |
| `NEXT_PUBLIC_SUPABASE_URL` | Study project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Study browser/server auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Study server writes. Never expose to the client |
| `STUDY_VISIT_SIGNING_KEY` | Server-only key for consent during this sign-in visit; required when Participant login is enabled |

Guest Join works with no Supabase vars.

## Run

```bash
npm run dev       # http://localhost:3000
npm test          # unit tests once
npm run test:watch
npm run build     # also runs scripts/check-env.mjs
npm run lint
```

Desktop browser only. Phone visitors see “Open on a computer.”

- Practice: http://localhost:3000 (**Try as guest** → device check → 15s lobby popup → `/call?guest=1`)
- Participant login: http://localhost:3000 (Login → allowlisted Google email → same landing with **Join interview**)
- Unique join link: http://localhost:3000/join?from=CODE (valid capped invite code → Google → same landing with **Join interview**)

## Optional study database (Supabase)

Guest practice does **not** need this. Run it only if you want Participant Google login, consent, capped join-links, and saved `study_sessions`.

Env vars alone are not enough. The app does **not** create tables. `npm run dev` and Netlify do **not** apply `supabase/migrations/001_study.sql`. You paste that file once in the Supabase SQL editor.

### 1. Confirm you have a project

`.env.local` should have `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for that same project. Add a separate random `STUDY_VISIT_SIGNING_KEY` (for example, generated with `openssl rand -hex 32`). Configure the same key in the deployment environment. Changing it signs out all active Participant visits.

### 2. Paste the migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select that project.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase/migrations/001_study.sql` in this repo, copy the entire file, paste into the editor.
4. Click **Run**. Success looks like “Success. No rows returned.”
5. Left sidebar → **Table Editor**. You should see `invited_emails`, `participants`, and `study_sessions`.

Safe to run once. The `create table if not exists` statements will not wipe data. Do not re-run blindly after you have added custom policies of your own.

### 3. Allowlist testers

Participant login (`/login`) lets an invited tester **Continue with Google** only if that Google email is already in `invited_emails`. Consent then creates `P001`.... A Gmail that is not on the list signs in to Google but **does not** become a Participant.

In SQL Editor:

```sql
insert into invited_emails (email)
values ('tester@gmail.com');
```

Use the real Google address, lowercase. Public sign-up is not supported.

For classmates you have not listed yet, use a capped join link instead. Paste `supabase/migrations/002_invite_links.sql` and then `supabase/migrations/004_atomic_join_enrollment.sql` into the SQL editor, in that order. Then create a code:

```sql
insert into invite_links (code, max_signups)
values ('rsu-k7m2', 11);
```

Send `/join?from=rsu-k7m2`. The valid invite code is the permission to join: the tester signs in with Google, returns to the same landing, chooses **Join interview**, agrees to consent, and enters the classroom. A slot is consumed only when a new Participant is created successfully. Returning testers do not consume another slot. **Sign out** on `/profile` ends the current session without consuming a slot and returns to the same join link (or `/` for allowlisted entry).

### 4. Auth URLs

In the same project: **Authentication** → **URL Configuration**.

- Site URL (local): `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

Enable **Google** under **Authentication** → **Providers**. After Google OAuth, testers return to their landing page, then choose **Join interview** to consent and enter. Google Cloud’s authorized redirect is `https://<project-ref>.supabase.co/auth/v1/callback`, not this app’s `/login` or `/join`.

Dashboard **Invite user** and Supabase magic-link emails are not used by this app. `POST /api/auth/magic-link` intentionally returns `410 gone`.

Without step 2, `/login` can still render, but nothing is stored and returning testers will not get a `P001`... id.

## Scoring (short)

`POST /api/score` is the only client grading entry. Groq emits raw 1–4 practice levels; the weights and the 0–100 **Practice progress** total are computed in `lib/content/rubric.ts` (`scoreReport`). There are no gates, verdicts, or pass thresholds. Speaking, pronunciation, fluency, and listening comprehension are never scored from a transcript.

- **Interview Answer Quality** — five criteria (Answer relevance 25, Content completeness 25, Japanese clarity 20, Grammar and politeness 20, Cross-answer consistency 10) shown as a radar / bars with level labels. Motivation and study-plan content stays visible as question-specific coaching inside Content completeness. A skipped Question gets a no-answer card. If every Question was skipped, `/call` shows mic-troubleshooting copy instead of the report and never POSTs `/api/score`.
- Every answer card shows evidence from the transcript, one improvement, and one example rewrite.

Speech Delivery has been removed. Audio streams for live captions; answers retain transcripts and attempt metadata, without recorded clips or word timestamps.

If Groq and DeepSeek both miss, the last screen is the locked sample practice report (`mocks/sample-report.json`) plus a scoring-unavailable banner.

Current rubric details: `docs/grading-system.md`. Prompt snapshot: `docs/rubric-generated.md`.

## Project layout

```text
app/                 Routes + API handlers (`/`, `/call`, `/login`, `/profile`, `/join`)
lib/server/          Secrets — never import from a "use client" file
lib/content/         Locked questions, rubric, sample report (safe anywhere)
public/              Sensei clips (`question-{id}.mp3`) and tile image
supabase/migrations/ Study SQL — paste in the dashboard, not auto-applied
scripts/             prebuild env check; generate-time TTS
docs/                PRD, issues, ubiquitous language, rubric snapshot
mocks/               sample-report.json (`banner` stays null)
```

Product requirements: `docs/prd-nihongo.md`. Domain terms: `docs/ubiquitous-language.md`. Current grading: `docs/grading-system.md`.

## Deploy (Issue 15)

Primary host is Netlify with the Next.js runtime plugin. Not deployed yet. If that adapter blocks deploy, the contingency is Vite + React + TS + Tailwind on Netlify with Netlify Functions for key-bearing routes. Do not implement that fallback unless the Next.js adapter actually fails.
