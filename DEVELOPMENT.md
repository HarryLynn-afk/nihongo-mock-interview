# NihonGo development guide

Local setup, optional study infrastructure, and maintainer notes. For the product overview and walkthrough, see [README.md](README.md).

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
| `DEEPGRAM_STT_API_KEY` | Live Japanese captions for signed-in, consented Participants; Guests use browser speech recognition. Needs a Deepgram **Member** (or higher) key — usage-only keys cannot mint a listen JWT. Missing or 403 fail-opens to browser captions |
| `DEEPSEEK_GRADE_API_KEY` | Optional grading fallback when Groq misses |
| `RESEARCH_FORM_URL` | Help the study after the report (hidden if unset) |
| `NEXT_PUBLIC_SUPABASE_URL` | Study project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Study browser/server auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Study server writes. Never expose to the client |
| `STUDY_VISIT_SIGNING_KEY` | Server-only key for consent during this sign-in visit; required when Participant login is enabled |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Shared rate-limit store for guarded APIs on serverless. Unset keeps per-instance in-memory limits (fine locally) |

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

- Practice: http://localhost:3000 (**Try a short practice** → device check → 15s lobby popup → `/call?guest=1`)
- Participant login: http://localhost:3000 (Login → allowlisted Google email → same landing with **Join interview**)
- Unique join link: http://localhost:3000/join?from=CODE (valid capped invite code → Google → same landing with **Join interview**)

## Optional study database (Supabase)

Guest practice does **not** need this. Run it only if you want Participant Google login, consent, capped join-links, and saved `study_sessions`.

Env vars alone are not enough. The app does **not** create tables. `npm run dev` and Netlify do **not** apply the files in `supabase/migrations/`. You paste them once in the Supabase SQL editor, in order — see step 2.

### 1. Confirm you have a project

`.env.local` should have `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for that same project. Add a separate random `STUDY_VISIT_SIGNING_KEY` (for example, generated with `openssl rand -hex 32`). Configure the same key in the deployment environment. Changing it signs out all active Participant visits.

### 2. Paste the migrations

1. Open [Supabase Dashboard](https://supabase.com/dashboard) and select that project.
2. Left sidebar → **SQL Editor** → **New query**.
3. Paste each file in `supabase/migrations/` **in order**, clicking **Run** after each: `001_study.sql`, `002_invite_links.sql`, `003_full_session_requests.sql`, `004_atomic_join_enrollment.sql`, `005_score_attempts.sql`, `006_survey_submissions.sql`, `007_atomic_allowlist_enrollment.sql`.
4. Success looks like “Success. No rows returned.”
5. Left sidebar → **Table Editor**. You should see `invited_emails`, `participants`, `study_sessions` (with `attempt_id` and `report`), `invite_links`, `full_session_requests`, and `survey_submissions`.

Safe to run once. The `create table if not exists` statements will not wipe data. Do not re-run blindly after you have added custom policies of your own.

### 3. Allowlist testers

Participant login (`/login`) lets an invited tester **Continue with Google** only if that Google email is already in `invited_emails`. Consent then creates `P001`.... A Gmail that is not on the list signs in to Google but **does not** become a Participant.

In SQL Editor:

```sql
insert into invited_emails (email)
values ('tester@gmail.com');
```

Use the real Google address, lowercase. Public sign-up is not supported.

For classmates you have not listed yet, use a capped join link instead (step 2 already applied the migrations this path needs). Then create a code:

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

## Implementation notes

- `/call` contains the interview and feedback report; there is no separate `/report` route.
- Guest practice uses three fixed questions and does not save research sessions. Guest answers are not merged into a participant session after login.
- Participant sessions select one question per topic and allow up to three topic-specific follow-ups. Enrollment requires Google sign-in and consent for the current visit.
- Question audio is committed in `public/`; ElevenLabs is used only when generating those assets.
- `POST /api/score` owns grading and participant report saving. Save failures can be retried through `/api/study/save-report` without regrading. The former public `/api/grade` and `/api/study/save` routes are retired.
- Deepgram listen tokens require a signed-in, consented Participant. Guests and failed Deepgram connections use browser speech recognition.
- Empty or no-kana answers allow two further attempts before skipping. If every question is skipped, microphone guidance replaces grading.
- The development-only **Skip interview** preview uses sample data. Live grading failures show scoring unavailable; they never substitute a sample report.

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

Current grading: [grading system](docs/grading-system.md).

## Deployment

The preview is hosted at https://nihongointerview.netlify.app using Netlify's Next.js runtime plugin (`netlify.toml`). Configure server secrets and production OAuth URLs in the deployment environment. A successful deploy does not verify the complete browser, provider, or study-data flow.

For deployment, configure both Upstash variables for shared rate limits. Without them, limits are held separately in each server instance. The Content Security Policy is currently report-only pending browser verification.

## Historical context

Earlier project notes refer to a Launch Pack rebuild, pitch mode, typed answers, and a six-score pass/fail rubric. These describe superseded versions. The rebuild was abandoned; pitch mode and typing are removed. Current feedback uses five transcript-based criteria and no pass/fail verdict. Older PRDs and issue documents should be read as historical where they conflict with current code and the README.
