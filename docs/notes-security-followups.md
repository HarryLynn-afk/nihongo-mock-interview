# Security follow-ups

Status of the security work as of 2026-10-01, so it can be picked up later.
Nothing here is committed-ready; most is deferred until deployment.

## Done

- **Origin + rate-limit guard** — `withApiGuard` in
  `lib/server/security/guard.ts`. Rejects cross-origin POSTs (403) and
  rate-limits by IP with presets (`expensive` / `write` / `auth`). Applied to
  `/api/deepgram-stt`, `/api/score`, `/api/grade` (expensive),
  `/api/full-session-request`, `/api/survey` (write), `/api/auth/login-google`,
  `/api/auth/join-google` (auth).
- **Security headers** — `next.config.ts` sets `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, HSTS, a camera/mic `Permissions-Policy`,
  and a **report-only** CSP.
- **Dependency patch** — `next` bumped to `^16.3.8`; `npm audit` reports 0
  vulnerabilities.
- **Supabase migrations verified** — 001–004 applied (5 tables, RLS on each,
  `participants_select_own` policy, `enroll_join_participant` function).
  Check query: `docs/supabase-migration-check.sql`.
- **Pushed** to `origin/main`.

## Decisions made

- **Host:** Netlify, **after the project is finished**.
- **Rate limits:** keep current presets; only 2–3 users per IP expected
  (older students, rarely the same Wi-Fi).
- **Spending caps:** yes — set hard limits in Deepgram / Groq / DeepSeek
  dashboards (dashboard work, not code).
- **Retention:** decide later.
- **CSP:** flip report-only → enforcing **after** the classroom is tested.

## Open items (at / after deploy)

1. **Redis rate-limit store — implemented 2026-10-12.** `withApiGuard` uses an
   Upstash Redis sliding window when `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` are set; without them it keeps the in-memory
   store (local dev, tests). Store outages fail open to the in-memory limit.
   Deploy step: create the Upstash database and set both env vars in Netlify.
2. **Verify headers are served** — `curl -I https://<domain>/` after deploy.
3. **Confirm `x-forwarded-for` is set by Netlify** — otherwise all users share
   one rate-limit bucket.
4. **CSP enforcing** — browser-test the live classroom (camera, Deepgram mic,
   Supabase), then change `Content-Security-Policy-Report-Only` to
   `Content-Security-Policy` in `next.config.ts`.
5. **Retention** — a `005_retention.sql` migration (`delete_old_rows()`) plus a
   `pg_cron` schedule, for `study_sessions.answers` (transcripts) and
   `full_session_requests.email`.
6. **Logging / alerting** — structured logs with no tokens or PII, plus an
   error-rate alert in the host dashboard.
7. **Provider caps** — configure in the Deepgram / Groq / DeepSeek dashboards.

## Future feature — admin dashboard

Idea (not designed or built): an admin surface to create unique join links and
set per-link limits, manage participants, and see usage.

Notes for when this starts:

- The DB already supports it: `invite_links` has `max_signups` and
  `signup_count`; enrollment is atomic via `enroll_join_participant`.
- The hard part is the **admin auth decision** — who is allowed to be an admin,
  and how that is verified. That is a security decision to settle first, not a
  UI one.
