# NihonGo — AI-powered Japanese language-school interview practice

**NihonGo** is an AI-powered Japanese language-school interview practice system. It is the working product for:

- **CSC 485** Introduction to Research Methodology for Computer Science — research the problem, review related work, define the research question, choose a method, consider ethics, and evaluate usefulness.
- **CSC 492** Computer Science Project — build, test, deploy, document, defend (oral examination), and present the web application.

This is not a hackathon or event-day demo. The 29 Aug Launch Pack rebuild is void.

A student joins a mock admission interview with Tanaka-sensei (Tokyo Pathway Japanese School), answers **by voice**, and sees an **Interview Readiness** report on `/call` (no `/report` route). Typing is not offered.

- **Guest** (**Try as guest** on `/` → `/call?guest=1`): practice in the browser. Not saved. Help the study still appears after the report if `RESEARCH_FORM_URL` is set.
- **Participant** (`/login` → `/consent` → **Join interview** → `/call`): allowlisted invited tester after magic-link login and consent this visit. Shown as `P001`…, never the email. Study N.
- **Pitch mode** (`/pitch` → `/call?pitch=1`): CSC 492 oral-exam / presentation demo path. Locked until `PITCH_ACCESS_KEY` matches. Skips lobby overlays, uses canned English/Burmese captions, always shows the live InterviewReport. Sample report is only when Groq grading misses. No Usefulness step. Not linked from `/`.

On `/call`, Tanaka-sensei plays committed `public/question-{id}.mp3`. The student Speaks Japanese (Deepgram live captions, or browser SpeechRecognition if Deepgram is unset). **Hear again** (speaker left of the Japanese headline) replays the Question while idle or paused. **Answer again** (**1 retry**, left of the mic) is one content redo before Submit, per Question. Empty or no-kana takes get two more Speak attempts, then the Question is skipped. Camera is optional; mic is required.

Do not print N5, JLPT, A1, Pass, or Fail on the splash, call, or report Headline.

## Stack

- **App:** Next.js (App Router) + TypeScript + Tailwind CSS v4
- **API:** Next.js Route Handlers (`app/api/*/route.ts`) — keys stay off the client
- **Tests:** Vitest + `@testing-library/react` + `jsdom` (`npm test`)
- **Host:** Netlify (`netlify.toml`) — not deployed yet
- **Grading:** `POST /api/score` → Groq (`qwen/qwen3.8-27b`) → sample InterviewReport if Groq misses. No n8n.
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
| `GROQ_TRANSLATE_API_KEY` | Tester English (`/api/translate`; `/call` does not POST this) |
| `GROQ_GRADE_API_KEY` | Interview grading (`/api/score`) |
| `GROQ_STT_API_KEY` | Background Japanese transcription (`/api/scribe`) |

**Optional:**

| Variable | Purpose |
| --- | --- |
| `ELEVENLABS_TTS_API_KEY` | Generate-time only (`scripts/generate-fallback-audio.ts`). Sensei plays committed `public/question-{id}.mp3` |
| `DEEPGRAM_STT_API_KEY` | Live Japanese captions. Needs a Deepgram **Member** (or higher) key — usage-only keys cannot mint a listen JWT. Missing or 403 fail-opens to browser captions |
| `WISPR_API_KEY` | Alternate live captions |
| `ELEVENLABS_SCRIBE_API_KEY` | Unused after Groq Whisper; safe to leave blank |
| `PITCH_ACCESS_KEY` | Pitch demo gate. Missing key fail-closes `/pitch` and `/call?pitch=1`. Not a paid API |
| `RESEARCH_FORM_URL` | Help the study after the report (hidden if unset; hidden on Pitch). Guest and Participant both POST |
| `NEXT_PUBLIC_SUPABASE_URL` | Study project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Study browser/server auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Study server writes. Never expose to the client |

Guest Join works with no Supabase vars. Pitch needs `PITCH_ACCESS_KEY` to unlock.

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
- Participant login: http://localhost:3000/login (then `/consent`, then Join)
- Pitch: http://localhost:3000/pitch (access key, then **Start demo** → `/call?pitch=1`)

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

Participant login (`/login`) lets an invited tester **Continue with Google** only if that Google email is already in `invited_emails`. Consent then creates `P001`…. A Gmail that is not on the list signs in to Google but **does not** become a Participant.

The magic-link form on `/login` still sends mail only for allowlisted emails. In SQL Editor:

```sql
insert into invited_emails (email)
values ('tester@gmail.com');
```

Use the real Google address, lowercase. Public sign-up is not supported. `/join?from=CODE` is a separate capped Google path for classmates you have not listed yet.

### 4. Auth URLs

In the same project: **Authentication** → **URL Configuration**.

- Site URL (local): `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

Dashboard **Invite user** is not the same as `/login` magic link. Invite emails redirect to the Site URL. If Site URL is only `/`, click the invite, wait to be sent to Study consent, then Agree. Do not type `/consent` yourself.

Leave **Email** provider enabled (magic link). Enable **Google** under **Authentication** → **Providers** (same OAuth client as `/join`). After Google or a magic-link click, testers land on `/consent`, then Join. Google Cloud’s authorized redirect is `https://<project-ref>.supabase.co/auth/v1/callback`, not this app’s `/login`.

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

- **Interview Answer Quality** — transcript radar / bars / `/100` (Answer relevance, grammar, Motivation, Study plan, Consistency) for answered Questions. A skipped Question gets a no-answer card. If every Question was skipped, `/call` shows mic-troubleshooting copy instead of the report and never POSTs `/api/score`.
- **Speech Delivery Signals** — browser clip timing from the spoken take (practice uses the same PCM sent to Deepgram). Not a speaking grade. Hidden when no spoken clip was captured.

If Groq misses (timeout, bad JSON, or 429/503/529 capacity skip), the last screen is the locked sample InterviewReport plus a scoring-unavailable banner.

## Project layout

```text
app/                 Routes + API handlers (`/`, `/pitch`, `/call`, `/login`, `/consent`)
lib/server/          Secrets — never import from a "use client" file
lib/content/         Locked questions, rubric, sample report (safe anywhere)
public/              Sensei clips (`question-{id}.mp3`) and tile image
supabase/migrations/ Study SQL — paste in the dashboard, not auto-applied
scripts/             prebuild env check; generate-time TTS
docs/                PRD, issues, ubiquitous language, rubric snapshot
mocks/               sample-report-ready.json (`banner` stays null)
```

Product requirements: `docs/prd-nihongo.md`. Domain terms: `docs/ubiquitous-language.md`.

## Deploy (Issue 15)

Primary host is Netlify with the Next.js runtime plugin. Not deployed yet. If that adapter blocks deploy, the contingency is Vite + React + TS + Tailwind on Netlify with Netlify Functions for key-bearing routes. Do not implement that fallback unless the Next.js adapter actually fails.
