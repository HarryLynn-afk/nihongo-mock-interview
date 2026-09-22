# NihonGo session state
> `/end-session` reads and updates this file only for Current State, Open Tasks, and Session Log.
> Do not open `CLAUDE.md` or `context.md` to close a session. Those stay as archives.
> Architecture rules, folder map, stack, key decisions, and "what not to do" stay in `CLAUDE.md` (loaded at session start).
> Product-direction locks stay in `context2.md`.

---

## Current State
- CSC 485 = research later. CSC 492 = working app. Not a hackathon. The presentation path is **Try as guest**, the three locked Questions. There is no `/pitch` route.
- `main` code HEAD `dffc946`. **31 commits ahead of `origin/main`**. **502/502** tests passing. Not deployed to Netlify.
- Built and still current: Issues 1–14, Direct Join 16–17, Pushback 22–24, quoted critique 25–26, Usefulness step 28, form-field map 29, Groq-only grade (`qwen/qwen3.8-27b`) + 60s capacity skip, coaching report (Overview then Review), Interview Answer Quality vs Speech Delivery Signals (Deepgram PCM, no second mic), voice-only, committed sensei mp3s, consent-this-visit, 15s lobby popup, guest-first `/` landing, Deepgram listen handshake, lobby camera retry, one-store Submit, try-again banner, `G-`/`P-` session codes, Guest `?guest=1` on the 3 locked Questions, spotlight classroom, Answer again / Hear again, Eng/MM, capped Google join-links, allowlisted Google login, PKCE + `prompt: "select_account"`, guest email request, grade on Speak Submit text only (no Whisper).
- `/`: Poppins guest-first hero, **Try as guest** only, header **Participant login** pill + Eng/MM. **Try as guest** → choice (continue as Guest, or leave email). If this visit already sent, the dialog shows **already-sent** (no form). Continue as Guest → lobby → 15s popup → `/call?guest=1`. **Participant login** is a Google-only dialog on `/login`.
- `/pitch` and `/call?pitch=1` show the Next.js not-found page.
- `/call`: voice-only. Guest = 3 locked Questions; Participant = topic bank + follow-ups. No guest practice banner. Report is Overview (stamp / radar / delivery) then Review (Q nav + card). Help the study for Participant only. Guest report can ask for email unless already sent this visit. Dev-only Skip interview still present.
- Scoring: `useGradeAnswers` → `POST /api/score` with Speak Submit transcripts only. ASR-aware lines in `getRubricPrompt()`. No `/api/scribe`, no Whisper, no `/api/translate`, no Wispr `/api/stt`. Sample on Groq miss. Speaking not in `/100`.
- Env: `check-env` requires only `GROQ_GRADE_API_KEY`. Optional: `ELEVENLABS_TTS_API_KEY` (generate-time), `DEEPGRAM_STT_API_KEY`, `RESEARCH_FORM_URL`, Supabase trio. Removed from example: translate / STT / Scribe / Wispr / Pitch access.
- Guest email: `POST /api/full-session-request` → `full_session_requests`. Still need SQL paste of `003_full_session_requests.sql` for live save.
- Untracked on purpose: learning-map, scoring/session notes, ui-ux-review, prototype HTMLs, `personal.md`.
- Live Guest Interview + Groq grade still not browser-verified this session (paid Deepgram/Groq not approved).

---

## Open Tasks
**CSC 492 / testers:** finish join-link ops if needed, remaining Issue 29 human items, then Issue 15 deploy. Formal docs / oral exam / presentation later.
**CSC 485:** research question and evaluation — deferred until testers can run.

1. **`/login` Continue with Google is confirmed working** (PKCE + account-chooser). Still live-verify `/join?from=<code>` end-to-end if not already done. After Netlify, update Google JS origins and Supabase Redirect URLs / Site URL.
2. Live-verify a Guest (3Q) or P001 practice Interview: Speech Delivery **Clear enough** / **Needs practice** when the transcript is complete, **and** Answer Quality `source: "grade"` (not sample). Click **1 retry** and Hear again once. Spends Deepgram + Groq grade only — ask before an agent run.
3. Confirm a Participant Skip + Submit land as two research-form rows with a `P-` session code. Guest report does not POST Help the study.
4. Native Burmese review of remaining MY drafts in report / survey / Question `burmeseTranslation` / `uiCopy.ts`.
5. Instructor written yes/no on RSU / CSC 485 consent — blocker before faculty testers.
6. Unpublish the old n8n **NihonGo grade** webhook.
7. Optional: `ELEVENLABS_TTS_API_KEY` only to regenerate clips. Set `DEEPGRAM_STT_API_KEY` to a **Member** key on Netlify if live captions should work.
8. Remove development-only **Skip interview** before Issue 15; then Netlify deploy; then update Supabase / Google off `localhost`.
9. Phase 3 root CSS (Arial override, dark-mode tokens, focus rings). Not a deploy blocker.
10. Mobbin polish (not a blocker).
11. CSC 485 research question — later.
12. User-count proof: Google Form N, not sign-up. Join-link `P00x` count as people; do not count Guest `G-` as unique students.
13. Later: scoring-fallback decisions (Gemini vs sample vs Retry UI). Do not `/build-plan` until chosen.
14. Later: one Groq critique per rubric category.
15. Later: live Burmese on the report (would need a new translate path — `/api/translate` was removed).
16. Later: InterviewReport refresh / draft resume after tab close.
17. Paste `supabase/migrations/003_full_session_requests.sql` so Guest email save succeeds.
18. Later: cap how many Guest sessions can run.
19. Later: Google account chooser brand name (“to continue to NihonGo”) after a public site + brand verification.

---

## Fold into CLAUDE.md later
- **Participant login is a dialog on `/login`.** Soft nav via `@modal`; hard visit shows start screen behind the dialog.
- **Pitch route is gone.** Do not restore `/pitch`, `?pitch=1`, access key, or `pitchAnswers.ts`.
- **Guest email request** → `full_session_requests` only. Already-sent dialog step when this visit already sent. No admin / no outbound mail here.
- **Grade path:** `useGradeAnswers` feeds `/api/score` with Speak Submit text only. ASR-aware `getRubricPrompt()`. No Whisper / `/api/scribe` / `GROQ_STT_API_KEY`.
- **Report chrome:** Overview (stamp / radar / delivery) then Review (Q nav + one card). No guest banner on `/call`.
- **Dead routes removed:** `/api/translate`, `/api/stt` (Wispr), ElevenLabs Scribe env module. `check-env` = `GROQ_GRADE_API_KEY` only.

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
| 2026-09-22 | Closed the session (`361b123`, 525 tests) | Help the study stays off Guest reports. Email request is saved here; the other project sends the mail. Guest session cap and Google brand name stay later. |
| 2026-09-22 | Report Overview/Review; already-sent email; drop guest banner; grade Submit text + ASR prompt; remove Whisper/translate/Wispr (`dffc946`, 502 tests) | Score Speak Submit only. No `/api/scribe`. `check-env` = grade key only. Do not restore Whisper as preferred grade input. |
