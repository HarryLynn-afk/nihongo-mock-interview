# NihonGo — AI-powered Japanese language-school interview practice

**NihonGo** is an AI-powered Japanese language-school interview practice system. It is the working product for:

- **CSC 485** Introduction to Research Methodology for Computer Science — research the problem, review related work, define the research question, choose a method, consider ethics, and evaluate usefulness.
- **CSC 492** Computer Science Project — build, test, deploy, document, defend (oral examination), and present the web application.

This is not a hackathon or event-day demo. The 29 Aug Launch Pack rebuild is void.

A student joins a mock admission interview with Tanaka-sensei (Tokyo Pathway Japanese School), answers by voice or type, and sees an **Interview Readiness** report on `/call` (no `/report` route).

- **Guest** (Join on `/`): practice in the browser. Not saved. Not counted in the study.
- **Participant** (`/login`): allowlisted invited tester after magic-link login and consent. Shown as `P001`…, never the email. Study N.
- **Pitch mode** (`/?pitch=1`): CSC 492 oral-exam / presentation demo path. Skips lobby overlays, uses canned English/Burmese captions, always shows the live InterviewReport. Sample report is only when Groq grading misses. No Usefulness step.

Do not print N5, JLPT, A1, Pass, or Fail on the splash, call, or report Headline.

## Stack

- **App:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **API:** Next.js Route Handlers (`app/api/*/route.ts`) — keys stay off the client
- **Tests:** Vitest + `@testing-library/react` + `jsdom` (`npm test`)
- **Host:** Netlify (`netlify.toml`) — not deployed yet
- **Grading:** `POST /api/score` → Groq (`qwen/qwen3.6-27b`) → sample InterviewReport if Groq misses. No n8n.
- **Database:** none for Guest or Pitch. Optional **Supabase** (Postgres) only for Participant login, consent, and saved study sessions.

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
| `ELEVENLABS_TTS_API_KEY` | Tanaka-sensei TTS (`/api/tts`) |
| `GROQ_TRANSLATE_API_KEY` | Tester English (`/api/translate`; `/call` does not POST this) |
| `GROQ_GRADE_API_KEY` | Interview grading (`/api/score`) |
| `GROQ_STT_API_KEY` | Background Japanese transcription (`/api/scribe`) |

**Optional:**

| Variable | Purpose |
| --- | --- |
| `DEEPGRAM_STT_API_KEY` | Live Japanese captions |
| `WISPR_API_KEY` | Alternate live captions |
| `ELEVENLABS_SCRIBE_API_KEY` | Unused after Groq Whisper; safe to leave blank |
| `RESEARCH_FORM_URL` | Usefulness step after the report (hidden if unset; hidden on Pitch) |
| `NEXT_PUBLIC_SUPABASE_URL` | Study project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Study browser/server auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Study server writes. Never expose to the client |

Guest Join and Pitch work with no Supabase vars.

## Run

```bash
npm run dev       # http://localhost:3000
npm test          # unit tests once
npm run test:watch
npm run build     # also runs scripts/check-env.mjs
npm run lint
```

Desktop browser only. Phone visitors see “Open on a computer.”

- Practice: http://localhost:3000
- Participant login: http://localhost:3000/login
- Pitch: http://localhost:3000/?pitch=1

## Optional study database (Supabase)

Guest practice does **not** need this. Run it only if you want Participant magic-link, consent, and saved `study_sessions`.

Env vars alone are not enough. The app does **not** create tables. `npm run dev` and Netlify do **not** apply `supabase/migrations/001_study.sql`. You paste that file once in the Supabase SQL editor.

### 1. Confirm you have a project

`.env.local` should already have `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for that same project.

### 2. Paste the migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select that project.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase/migrations/001_study.sql` in this repo, copy the entire file, paste into the editor.
4. Click **Run**. Success looks like “Success. No rows returned.”
5. Left sidebar → **Table Editor**. You should see `invited_emails`, `participants`, and `study_sessions`.

Safe to run once. The `create table if not exists` statements will not wipe data. Do not re-run blindly after you have added custom policies of your own.

### 3. Allowlist testers

Participant login only sends a magic link if the email is in `invited_emails`. In SQL Editor:

```sql
insert into invited_emails (email)
values ('tester@example.com');
```

Use a real invited address, lowercase. Public sign-up is not supported.

### 4. Auth URLs

In the same project: **Authentication** → **URL Configuration**.

- Site URL (local): `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

Dashboard **Invite user** is not the same as `/login` magic link. Invite emails redirect to the Site URL. If Site URL is only `/`, click the invite, wait to be sent to Study consent, then Agree. Do not type `/consent` yourself.

Leave **Email** provider enabled (magic link). After a Participant clicks the email, they land on `/consent`, then Join.

Without step 2, `/login` still shows the same “if eligible…” copy, but nothing is stored and returning testers will not get a `P001`… id.

### 5. Magic Link email template (stops “already used” links)

The default template links to Supabase's `/auth/v1/verify` URL. Mail providers such as Gmail open links to scan them, which **spends the one-time token before the tester clicks it**. The tester then sees “already opened or has expired” on a brand-new email.

Fix it in **Authentication** → **Emails** → **Magic Link**. Point the link at this app and pass `token_hash`, so the token is only spent when a browser actually reaches `/auth/callback`:

```html
<h2>Your sign-in link</h2>
<p>Follow the link below to sign in. This link can only be used once.</p>
<p>
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink">
    Sign in
  </a>
</p>
```

Set **Site URL** to `http://localhost:3000` for this to resolve locally (and to the deployed origin later). `GET /auth/callback` verifies `token_hash` server-side and redirects to `/consent`.

## Scoring (short)

`POST /api/score` is the only client grading entry. Groq emits raw 1–5 scores; weights, Gates, Headline, and Stamp are computed in `lib/content/rubric.ts` (`scoreReport`). Speaking is not a Gate and is omitted from `/100`.

- **Interview Answer Quality** — transcript radar / bars / `/100` (Answer relevance, grammar, Motivation, Study plan, Consistency)
- **Speech Delivery Signals** — browser clip timing on voice Interviews only (not a speaking grade). Typed Interviews hide this section.

If Groq misses (timeout, bad JSON, or 429/503/529 capacity skip), the last screen is the locked sample InterviewReport plus a scoring-unavailable banner.

## Project layout

```text
app/                 Routes + API handlers (`/`, `/call`, `/login`, `/consent`)
lib/server/          Secrets — never import from a "use client" file
lib/content/         Locked questions, rubric, sample report (safe anywhere)
supabase/migrations/ Study SQL — paste in the dashboard, not auto-applied
scripts/             prebuild env check
docs/                PRD, issues, ubiquitous language, rubric snapshot
mocks/               sample-report-ready.json (`banner` stays null)
```

Product requirements: `docs/prd-nihongo.md`. Domain terms: `docs/ubiquitous-language.md`.

## Deploy (Issue 15)

Primary host is Netlify with the Next.js runtime plugin. Not deployed yet. If that adapter blocks deploy, the contingency is Vite + React + TS + Tailwind on Netlify with Netlify Functions for key-bearing routes. Do not implement that fallback unless the Next.js adapter actually fails.
