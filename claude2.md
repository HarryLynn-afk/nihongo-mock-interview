# NihonGo session state
> `/end-session` reads and updates this file only for Current State, Open Tasks, and Session Log.
> Do not open `CLAUDE.md` or `context.md` to close a session. Those stay as archives.
> Architecture rules, folder map, stack, key decisions, and "what not to do" stay in `CLAUDE.md` (loaded at session start).
> Product-direction locks stay in `context2.md`.

---

## Current State
- CSC 485 = research later. CSC 492 = working app. Not a hackathon. The presentation path is **Try as guest**, the three locked Questions. There is no `/pitch` route.
- `main` HEAD `9d67815` (guests limited to the three locked questions; pitch route removed). **21 commits ahead of `origin/main`**. **508/508** tests passing on the last full run. Not deployed to Netlify.
- Built and still current: Issues 1–14, Direct Join 16–17, Pushback 22–24, quoted critique 25–26, Usefulness step 28, form-field map 29, Groq-only grade (`qwen/qwen3.8-27b`) + 60s capacity skip, coaching report, Interview Answer Quality vs Speech Delivery Signals (Deepgram PCM, no second mic), voice-only (typing removed), committed sensei mp3s, consent-this-visit, 15s lobby popup, guest-first `/` landing, Deepgram listen handshake, lobby camera retry, one-store Submit, try-again banner, `G-`/`P-` session codes, Guest `?guest=1` on the 3 locked Questions, spotlight classroom, Answer again / Hear again, Eng/MM, capped Google join-links, allowlisted Google login, dev-only whoami line, PKCE + `prompt: "select_account"`.
- `/`: Poppins guest-first hero, **Try as guest** only, header **Participant login** pill + Eng/MM, three glance pills, How it works section. Caption: “Three questions. Guest practice isn't saved.” No sensei photo, no Profile card, no Practice nav. Join → lobby → 15s popup → `/call?guest=1`. **Participant login** opens a dialog over this screen and changes the URL to `/login` (soft clicks use `@modal`; a direct `/login` visit shows the same dialog). Dialog is **Continue with Google** only. The invited-tester line sits under that button. No Try as guest and no guest-practice note on the dialog.
- `/pitch` and `/call?pitch=1` show the Next.js not-found page. No access key, no scripted sample answers, no separate pitch classroom.
- `/call`: voice-only. Guest (`?guest=1`) asks the 3 locked Questions in `questions.ts` and does not draw the topic bank or follow-ups. A consented Participant on `/call` still draws the 10-topic bank plus follow-ups. JA + one helper (EN xor MY) from the Question itself; Hear again on the HUD; 1 Answer again before Submit; report after the session; all-skipped → `MicTroubleScreen` and no `/api/score`; Help the study 8s after reveal for Participant only (not Try as guest). Dev-only Skip interview still present.
- Scoring: `POST /api/score` → `runGroqGrade` → sample on miss. Speaking is not in `/100`. `source` is `grade` | `sample`.
- Study: `/login` is a Google-only dialog over the start screen, still allowlist-gated (Google sign-in itself was confirmed live before this dialog). Magic-link route returns 410. `/join?from=CODE` shares the PKCE fix but was not separately live-clicked. `/consent` still requires Agree this visit.
- Untracked on purpose: `docs/learning-map.md`, `docs/notes-scoring-capacity-fallback.md`, `docs/notes-session-api-cost.md`, `docs/ui-ux-review.md`, `docs/prototype-landings.html`, `docs/prototype-guest-cta.html`, `docs/prototype-brilliant-exact.html`, `docs/prototype-nav-profile.html`.
- Live Guest Interview + Groq grade was not browser-verified (paid Deepgram/Groq not approved). `/` landing was browser-checked (desktop + mobile). The login dialog was browser-checked on desktop and a phone-sized viewport: open from the header, Close, Escape, direct `/login`, and `/login?error=not_invited`. Continue with Google was not clicked (would start Google OAuth).

---

## Open Tasks
**CSC 492 / testers:** finish join-link ops if needed, remaining Issue 29 human items, then Issue 15 deploy. Formal docs / oral exam / presentation later.
**CSC 485:** research question and evaluation — deferred until testers can run.

1. **`/login` Continue with Google is confirmed working** (PKCE + account-chooser). Still live-verify `/join?from=<code>` end-to-end if not already done: Google picker → `/consent` → `P00x`, second account choosable. While the Google app is Testing, add each tester Gmail as a Test user. After Netlify, add the live origin to Google JS origins and Supabase Redirect URLs / Site URL.
2. `GUEST_BANNER` still says Guest is not part of the study. That matches the report: Try as guest does not show Help the study and does not POST a research row.
3. Live-verify a Guest (3 Questions) or P001 (topic bank) practice Interview after the Submit lock: Speech Delivery **Clear enough** / **Needs practice** (not **Not assessed** when the transcript is complete) **and** Interview Answer Quality `source: "grade"` (not the sample banner). Also click **1 retry** once (same Deepgram engine, then idle Speak) and Hear again on the HUD (idle/paused only). Spends Deepgram + Groq Whisper + Groq grade — ask before an agent run.
4. Confirm Skip + Submit land as two research-form rows with a `G-` or `P-` session code (not a UUID).
5. Native Burmese review of remaining MY drafts (`။` / `၊`) in report templates, survey copy, Question `burmeseTranslation`, and `lib/content/uiCopy.ts` chrome. Replace strings in content modules only.
6. Instructor written yes/no on RSU / CSC 485 consent beyond the in-app one-liner — blocker before faculty testers or applicants.
7. Unpublish the old n8n **NihonGo grade** webhook so nothing can still hit it. `N8N_WEBHOOK_URL` is no longer required.
8. Optional: `ELEVENLABS_TTS_API_KEY` only to regenerate clips (`scripts/generate-fallback-audio.ts`). `WISPR_API_KEY` optional. If live captions should work on Netlify, set `DEEPGRAM_STT_API_KEY` to a **Member** (or higher) key — usage-only keys 403 the grant. `PITCH_ACCESS_KEY` is unused.
9. Remove the development-only **Skip interview** control before Issue 15. Then Netlify deploy when satisfied with the demo. After deploy, update Supabase Site URL / Google origins off `localhost`.
10. Phase 3 root CSS (still open): drop Arial override, lock color scheme so OS dark mode does not fight tokens, add focus rings. `/` now has feather/macaw tokens + Poppins; that does not close this item. Not a deploy blocker.
11. Mobbin polish (not a blocker). `/` landing restyle is done — do not reopen Dual-CTA / sensei-photo / header Practice unless asked.
12. CSC 485 research question — later, not this week.
13. User-count proof for grading: **Google Form N**, not sign-up. Confirm the marking scheme with the supervisor before building accounts. Join-link Participants count as people (`P00x`); do not report Guest `G-` rows as unique students.
14. Later (not this week): pick scoring-fallback decisions — Gemini as second grader vs sample last screen vs Retry UI. Do not `/build-plan` until those are chosen. Local notes file is untracked on purpose.
15. Later: Groq one quoted critique **per rubric category** (not only per Question). Do not `/build-plan` until that contract is chosen.
16. Later: live Burmese explanation on the report via `/api/translate` (locked MY templates are what MM shows now).
17. Later (discussed, not built): InterviewReport refresh / mid-interview draft resume after tab close — large; a profile is not required for a draft stash. Do not `/build-plan` until chosen.
18. Guest email request is built in this app. **Try as guest** opens a choice; the Guest report asks again unless this visit already sent. Saves go to `full_session_requests` only. Paste `supabase/migrations/003_full_session_requests.sql` before a live save succeeds. No admin route and no mail from this app. The other project reads the table and sends the email when the address is added to `invited_emails`.
19. Later: cap how many Guest sessions can run. Do not `/build-plan` until that cap is chosen.
20. Later: Google’s account chooser should say **to continue to NihonGo** instead of the Supabase project URL. That is Google brand verification (app name, logo, public homepage, privacy policy, Search Console) after a public site exists. Showing the Supabase address is safe. Do not `/build-plan`. Do not submit verification from localhost.

---

## Fold into CLAUDE.md later
- **Participant login is a dialog on `/login`.** Header click soft-navigates; `@modal/(.)login` keeps the start screen mounted. A hard visit (refresh, bookmark, middleware redirect) renders the start screen behind the same dialog. Close / Escape / backdrop leaves `/login`. Do not make it a client-only modal with no route change.
- **Login dialog copy.** Google only. No Try as guest, no “guest practice stays on the start screen” note, no GitHub, no email. Invited-tester line sits under **Continue with Google**. Title stays above the button.
- New files: `app/components/ParticipantLoginDialog.tsx`, `app/@modal/default.tsx`, `app/@modal/(.)login/page.tsx`. Root layout renders the `modal` slot.
- **Pitch route is gone.** Do not restore `/pitch`, `?pitch=1`, the access key, or `pitchAnswers.ts`. Guest `/call?guest=1` is the 3 locked Questions. Participant `/call` is the topic bank. Old pitch URLs show the Next.js not-found page. Email capture for the full session is later.

---

## Session Log
Rows before 2026-09-22 stay in `CLAUDE.md`. Append new rows here only.

| Date | Task completed | Decisions made |
|------|---------------|----------------|
| 2026-09-22 | Split living session state into `claude2.md` and `context2.md` | `/end-session` updates these two files and does not re-read `CLAUDE.md` or `context.md` |
| 2026-09-22 | Participant login opens as a dialog on `/login` | Route stays `/login`. Dialog is Google-only. No Try as guest and no guest-practice note. Invited-tester line sits under Continue with Google. |
| 2026-09-22 | Guests practice the 3 locked Questions; pitch route removed (`9d67815`) | Participant `/call` keeps the 10-topic bank. `/pitch` and `/call?pitch=1` show the Next.js not-found page. Email request for the full session is later. |
| 2026-09-22 | Marked Google sign-in brand name as later | Account chooser may keep showing the Supabase project URL. “to continue to NihonGo” waits on Google brand verification after a public site. The URL is safe to show. |
| 2026-09-22 | Guest email request UI | Choice before the lobby, report ask like Help the study, save to `full_session_requests`. SQL paste still required. No admin page and no outbound mail in this app. |
