# NihonGo session state
> `/end-session` reads and updates this file only for Current State, Open Tasks, and Session Log.
> Do not open archived `CLAUDE.md` content or `docs/archive/context-2026-08-28-grill.md` to close a session. Those stay as archives.
> The auto-loaded `CLAUDE.md` is now a short bootstrap; older history is in `docs/archive/`.
> Stable product locks stay in `context2.md`; old history stays archived unless explicitly requested.

---

## Current State
- CSC 485 = research later. CSC 492 = working app. Not a hackathon. Presentation path is **Try as guest**, the three locked Questions. No `/pitch` route.
- `main` is **pushed to `origin/main`** (`8f02c1e`; **not deployed** — Netlify later). Full suite **606/606**, TypeScript 0, lint **0/0**. `main` is the checked-out branch; `feat/not-invited-request-email` is stale (still at `6e1aeed`). Live Google sign-in + browser visual QA still unchecked.
- **This session (2026-10-01):** (1) **Security** — `withApiGuard` (same-origin 403 + per-IP rate limit) on `/api/deepgram-stt`, `/api/score`, `/api/grade`, `/api/full-session-request`, `/api/survey`, `/api/auth/login-google`, `/api/auth/join-google`; baseline security headers + **report-only** CSP in `next.config.ts`; `next` bumped to `^16.3.8` (**0 `npm audit` vulns**); Supabase migrations 001–004 verified applied (`docs/supabase-migration-check.sql`). (2) **Light theme everywhere** — `/call`, the report, all post-call dialogs, and `/auth/continue` moved off the dark ink/paper/indigo palette; that palette and its dead variants were deleted. Text contrast bumped on report + classroom. (3) **Guest join unified** — `/guest` route deleted; guest join is now the same landing modal as Participant (`JoinInterview`). (4) **Report actions** — Practice again / Back to home at the report bottom; mid-interview **End interview** (red pill + confirm; nothing persists on exit).
- **Landing copy session (2026-10-01):** hero states the purpose — headline **Practice your Japanese language-school interview**, short subhead "Answer mock interview questions in Japanese and receive AI feedback.", secondary disclaimer "Practice and coaching only—not an admission, visa, or COE assessment." Participant CTA is **Join Interview** (set one type size above the guest CTA); Guest CTA is **Try a short practice**; the extra supporting label was dropped to keep the hero short. Language tabs read **English** / **မြန်မာ**; gray body token `--color-wolf` `#777777` → `#666666` for AA on the pale green. Commits `a700f59` (copy) → `651de07` (revert) → `9caab1b` (reapply) → `dba91e3` (trim + CTA); pushed.
- Built and still current: Issues 1–14, Direct Join 16–17, Pushback 22–24, critique 25–26, Usefulness 28, form-field map 29, report Overview→Review, Answer Quality vs Delivery, voice-only, committed sensei mp3s, consent-this-visit, 15s overlay, guest-first `/`, Deepgram listen, lobby camera retry, one-store Submit, try-again banner, `G-`/`P-`, spotlight classroom, Answer again / Hear again, Eng/MM, join-links, Google PKCE + account chooser, guest email request, Groq→DeepSeek grade fallback, Speak idle auto-pause, Profile/Login right of ENG/MM, lint 0/0.
- `/`: Poppins guest-first hero. **Try as guest** opens the join modal on `/` (no page change). Header **Login** opens the Google dialog on `/login`; after sign-in the landing shows **Join Interview** and **Profile** only — no guest practice.
- **Guest-after-login removal (2026-10-01):** guest practice is anonymous-only. Signed-in landing dropped **Try a short practice**; `/consent` dropped **Try as guest instead**; middleware 307s a signed-in `/call?guest=1` to the landing. This closes the only path where a consented participant's 3-question guest run could be saved to `study_sessions`.
- **Survey + devices + delivery (2026-10-01):** Help the study posts the live form's 13 questions (10 ratings + 3 open-ended) and no longer sends session id / headline / total / source / pushback metadata (`f9ae945`). `/call` shows blocked mic/camera help instead of failing silently; the lobby shows a dB-scale live mic level bar (`ceb3dc1`). Speech Delivery Signals now names its `notAssessedReason` (`tooShort` / `tooQuiet` / `noSpeech` / `empty`) (`edba3b0`). A candidate fix replaces the fallback `MediaRecorder` for the delivery clip with one Web Audio PCM capture (`7d168da`, **not verified live**). Bug report: `docs/bug-speech-delivery-no-audio.md` (`4efe427`).
- **Delivery coaching rewrite (`a452adb`, 2026-10-01):** the fixed RMS silence detector is gone — it could turn quiet speech into a confident **Needs practice** (a normal answer scored 20.4 chars/sec). Delivery now uses **Deepgram word timestamps** and reports only **mid-answer gaps ≥ 2.0s**; **characters-per-second and raw pause counts are removed**, along with the judged labels **Clear enough** / **Needs practice**. New `lib/content/deliveryCoaching.ts` renders `Review N point(s)` / `No notable issue detected` / `Unable to assess`, each with question + measured pause + a canned **Try next**. Browser STT has no timestamps → always **Unable to assess**, never a negative tip. Template + evidence; no extra LLM call.
- **Live transcript continuity (`eb29b97`…`8f02c1e`, pushed; 2026-10-01):** removed the invalid `words=true` from the Deepgram listen URL (`eb29b97`). A dev-only `[audio]` trace proved pause (manual or 10s idle) closed the socket, so resume minted a new token and lost 1–2s of speech. The session now lives for the whole Speak attempt: mic capture starts in parallel with the handshake and buffers until open; pause snapshots the delivery PCM, stops the mic, and sends `KeepAlive` every 8s; resume attaches a new capture to the same socket. Speech Delivery moved from one session panel into each question card (tip / no-pause / unable-to-assess). Instrumentation added for the trace, then removed. User live-verified.
- `/join?from=CODE`: same landing only when `CODE` exists in `invite_links`; unknown → not-found. Open link keeps its code through Google + consent. Full link shows the dismissible popup (Login/Join hidden, guest stays). New tester uses one capped-link slot on consent.
- Join flow (both modes, on the landing): **Join Interview** / **Try a short practice** → device-lobby dialog → 15s start overlay (Skip + cancel) → `/call` (or `/call?guest=1`). Guest skips consent.
- `/call`: Guest 3Q; Participant bank + follow-ups. No guest banner. Help the study needs a Google session (either mode); an anonymous guest gets the report email ask instead. Dev **Skip interview** still present (`SHOW_SKIP_INTERVIEW`).
- Scoring: `POST /api/score` → Groq → DeepSeek → `report: null`. Optional `DEEPSEEK_GRADE_API_KEY`. `check-env` requires only `GROQ_GRADE_API_KEY`.
- Untracked on purpose: `docs/notes-security-followups.md`, `docs/supabase-migration-check.md`/`.sql`, `docs/current-development-handoff.md`, `docs/archive/`, learning-map / scoring / ui-ux notes, prototype HTMLs, `personal.md` (do not commit; says "Don't check by any AI").

---

## Open Tasks
**CSC 492 / testers:** join-link ops if needed, Issue 29 human items, Issue 15 deploy. Formal docs / oral exam later.
**CSC 485:** research question — deferred.
**Security (see `docs/notes-security-followups.md`):** at deploy — Redis rate-limit store (Netlify is serverless), verify headers + `x-forwarded-for`, flip CSP report-only → enforcing after browser test; later — retention migration, provider spend caps, logging/alerts. Future feature: admin dashboard for join links (settle admin auth first).

1. Live-verify Google sign-in from `/` and an open `/join?from=<code>`: each returns to the same landing, Profile opens only when clicked, consent precedes device setup, and `/call` opens. For a new invite, confirm `signup_count` increases once and Sign out restores the guest landing. Migration `004` is applied. After Netlify, update Google origins + Supabase Site URL and set `STUDY_VISIT_SIGNING_KEY` there.
2. Live-verify Guest or P001: Delivery tips come only from real timestamps (a `Review N point(s)` card or `No notable issue detected`, never a false **Needs practice**), Answer Quality `source: "grade"` (Groq or DeepSeek — not unavailable). Click Answer again + Hear again once. Ask before paid Deepgram/Groq/DeepSeek.
3. Confirm Participant Skip + Submit → two research-form rows with `P-`. An anonymous guest does not POST Help the study (Help the study is signed-in reports only).
4. Native Burmese review of remaining MY drafts.
5. Instructor written yes/no on RSU / CSC 485 consent.
6. Unpublish old n8n **NihonGo grade** webhook.
7. Optional Netlify: `DEEPGRAM_STT_API_KEY` (Member), `DEEPSEEK_GRADE_API_KEY` (+ ~$2 credit), `ELEVENLABS_TTS_API_KEY` only to regenerate clips.
8. Remove **Skip interview** before Issue 15; Netlify deploy; move Supabase / Google off `localhost`.
9. Phase 3 root CSS. Not a deploy blocker.
10. Mobbin polish (not a blocker).
11. CSC 485 research question — later.
12. User-count proof: Google Form N; `P00x` people; do not count Guest `G-` as unique students.
13. Later: one Groq critique per rubric category.
14. Later: live Burmese on the report (new translate path — `/api/translate` removed).
15. Later: InterviewReport refresh / draft resume after tab close.
16. Later: Guest session cap.
17. Later: Google account chooser brand name after public site + brand verification.
18. Later: soft dock hint if testers miss auto-pause (no modal).
19. **Speech Delivery empty clip** — the coaching rewrite (`a452adb`) supersedes the old judged labels, but the 0-byte clip (`docs/bug-speech-delivery-no-audio.md`) still needs a live check that an answered Question always yields a clip (one-PCM-capture fix `7d168da` is unverified live). Then live-verify the new coaching cards (folds into task 2).

---

## Fold Into Context Later
- **Participant login is a dialog on `/login`.** Soft nav via `@modal`; hard visit shows start screen behind the dialog.
- **Pitch route is gone.** Do not restore `/pitch`, `?pitch=1`, access key, or `pitchAnswers.ts`.
- **Guest email request** → `full_session_requests` only, and only from the Guest report (`form` then `saved`). **Try as guest** does not ask. If this visit already sent, the report does not open the form. No choice step and no already-sent dialog.
- **Grade path:** Groq primary → DeepSeek Flash secondary → unavailable. Speak Submit text only. No Whisper.
- **Answer again:** visible label Answer again; secret cap 1; same STT engine on redo.
- **Speak idle:** auto-pause after 10s with no new transcript; no popup.
- **Report chrome:** Overview then Review. No guest banner on `/call`.
- **Dead routes removed:** `/api/translate`, `/api/stt`, Scribe env. `check-env` = `GROQ_GRADE_API_KEY` only.
- **Lobby camera:** stop lobby tracks when Interview starts / on unmount; do not leave a second live getUserMedia against `/call`. Call Camera toggle must stop/restart the stream and reattach + `play()` on remount.
- **Guest join is the landing modal, anonymous-only.** An anonymous visitor's **Try as guest** opens the same in-page lobby dialog as Participant (no `/guest` route — removed 2026-10-01). Guest skips consent. 15s reminder is the same overlay; do not add a **Start interview** button on `/call`. **After Google sign-in there is no guest practice** — the landing shows **Join Interview** and **Profile** only, and consent no longer offers **Try as guest instead**.
- **Join link landing.** `/join?from=CODE` reuses `Home` only for a stored invite code; `/join` and unknown codes return not-found. **Login** opens `GoogleSignInDialog` titled **Join NihonGo**, with the invited-tester line under Continue with Google. Continue posts join-google with the code. Do not send that button to `/login`. Do not put **Try as guest**, **Participant login**, or ENG/MM inside the Google dialog. Do not restore the practice-group sentence or the glance pills. `/login` stays allowlisted and has no invite code.

---

## Session Log
Rows before 2026-09-23 stay in `docs/archive/claude-archive-2026-09-23.md`. Append new rows here only.

| Date | Task completed | Decisions made |
|------|---------------|----------------|
| 2026-09-23 | Invalid join links return 404 (`9f9a106`, focused join tests 24/24) | `/join` and unknown invite codes no longer render the landing. Valid stored invite codes still show the join landing; full stored links keep the full-link state. Pushed `main` to `origin/main`. |
| 2026-09-23 | Token cleanup for session context | Local ignored `CLAUDE.md` is a 47-line bootstrap; old content is archived in `docs/archive/claude-archive-2026-09-23.md`. `end-session` skill now reads/writes `claude2.md` and `context2.md` only when needed. |
| 2026-09-24 | Correct invited sign-in documentation (`2a58dee`) | README and Supabase migration comments now describe Google login and capped join links. No tests run; commit not pushed. |
| 2026-09-24 | Tester account, sign-out, visit consent, atomic enrollment (`56bd33d`) | User ran migration `004`; Supabase screenshot shows `full_session_requests`. Live Google flow remains to verify. Commit not pushed. |
| 2026-09-24 | Landing return, profile, full-link popup, flow docs, lint checklist (`0ea98a9`, `2f1e5ab`, `d68d414`) | 547 full-suite tests, final focused popup tests 10/10, TypeScript, and Webpack build passed. Three commits on `main`, not pushed. Live Google and browser visual checks remain open. |
| 2026-09-25 | Header actions right of EN/MM; all lint findings fixed (`cc07e84`, `574e991`) | Profile/Login moved right of the language toggle. Lint is 0 errors / 0 warnings; `docs/lint-cleanup.md` deleted. Hook fixes: `useSyncExternalStore` locale store, adjust-during-render prop syncs, refs→state in `useAnswerCapture`, `next/font` Myanmar, 4 justified mount-read suppressions. 549/549 tests, TypeScript, `next build` pass. `574e991` not pushed. |
| 2026-10-01 | Security hardening; app-wide light theme; guest join unified into the landing modal; report + End-interview actions (`24f4665`…`f80ca66`, pushed) | `withApiGuard` (origin + per-IP limit) on paid/write/auth routes; baseline headers + **report-only** CSP; `next` `^16.3.8` (0 vulns); migrations 001–004 verified. `/guest` deleted → guest join is the landing modal; dark ink/paper/indigo palette removed app-wide. Netlify later → Redis store needed at deploy; CSP flips to enforcing after browser test. 559/559. |
| 2026-10-01 | Help the study for any signed-in report (`06703d9`, not pushed) | New `reportTopAction` returns one of `help`/`request`/`null`, so the two can never overlap; new `GET /api/study/auth` (Supabase session only, fails closed). Signed-in guest shows Help the study and loses the email ask; anonymous guest keeps the email ask. 4 participant page tests now mock a signed-in session. 570/570, TS 0, lint 0/0. |
| 2026-10-01 | Guest practice is anonymous-only and unreachable when signed in (not committed) | Removed the signed-in **Try a short practice** button from `Home` and the **Try as guest instead** link from `/consent`; deleted the now-unused `consent.guestInstead` copy (EN + MY). Middleware now 307s a signed-in `/call?guest=1` to the landing, so guest mode is anonymous-only. Guest CTA/caption stay for anonymous visitors. Closes the signed-in `study_sessions` leak from guest mode. 594/594, TS 0, lint 0/0. |
| 2026-10-01 | Purpose landing copy, trimmed hero, join CTA + language labels; AA gray (`a700f59`…`dba91e3`, pushed) | Headline **Practice your Japanese language-school interview** + short subhead + practice-only disclaimer; participant CTA **Join Interview** (one size up), guest **Try a short practice**; tabs **English/မြန်မာ**; `--color-wolf` → `#666666` for 5.14:1 on the pale green. Supporting label dropped to minimize text. 570/570, TS 0, lint 0/0. |
| 2026-10-01 | Full research survey to the live Google Form; device failures + mic level bar (`f9ae945`, `ceb3dc1`) | Survey collects the form's 10 ratings + 3 open-ended and drops the metadata the form no longer has. `/call` shows blocked mic/camera help; lobby shows a dB-scale mic level bar on the existing stream. 585/585, TS 0, lint 0/0. |
| 2026-10-01 | Delivery `notAssessedReason` + unified PCM capture + bug report (`edba3b0`…`4efe427`) | `AnalyzedClip.notAssessedReason` (`tooShort`/`tooQuiet`/`noSpeech`/`empty`) made the report name the cause, which revealed the empty (0-byte) delivery clip. Candidate fix `7d168da` drops the fallback `MediaRecorder` for one `startPcmCapture` (unverified live). Bug report for hand-off at `docs/bug-speech-delivery-no-audio.md`. 594/594, TS 0, lint 0/0. |
| 2026-10-01 | Delivery coaching rewrite: RMS detector → Deepgram word timestamps (`a452adb`) | Removed chars/sec, raw pause counts, and the judged labels Clear enough / Needs practice. Only mid-answer gaps ≥ 2.0s tip; `Review N point(s)` / `No notable issue detected` / `Unable to assess` each carry question + pause + a canned Try next. Browser STT can never tip. Committed to `main` (9 ahead, not pushed); `feat/not-invited-request-email` left stale. 600/600, TS 0, lint 0/0. |
| 2026-10-01 | Deepgram live transcript continuity + per-question Speech Delivery (`eb29b97`…`8f02c1e`, pushed) | Invalid `words=true` removed; mic starts in parallel with the handshake and buffers until open; one session per Speak attempt with `setPaused`/KeepAlive (8s) and same-socket resume; delivery moved into each question card. Trace instrumentation added then removed. User live-verified. 606/606, TS 0, lint 0/0. |
