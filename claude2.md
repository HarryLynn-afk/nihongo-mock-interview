# NihonGo session state
> `/end-session` reads and updates this file only for Current State, Open Tasks, and Session Log.
> Do not open `CLAUDE.md` or `context.md` to close a session. Those stay as archives.
> Architecture rules, folder map, stack, key decisions, and "what not to do" stay in `CLAUDE.md` (loaded at session start).
> Product-direction locks stay in `context2.md`.

---

## Current State
- CSC 485 = research later. CSC 492 = working app. Not a hackathon. The presentation path is **Try as guest**, the three locked Questions. There is no `/pitch` route.
- `main` HEAD `f838b80`. **37 commits ahead of `origin/main`**. **513/513** tests passing. Not deployed to Netlify.
- Built and still current: Issues 1–14, Direct Join 16–17, Pushback 22–24, quoted critique 25–26, Usefulness step 28, form-field map 29, coaching report (Overview then Review), Interview Answer Quality vs Speech Delivery Signals (Deepgram PCM), voice-only, committed sensei mp3s, consent-this-visit, 15s lobby popup, guest-first `/`, Deepgram listen, lobby camera retry, one-store Submit, try-again banner, `G-`/`P-` codes, Guest 3 locked Questions, spotlight classroom, Answer again / Hear again, Eng/MM, join-links, Google login PKCE + account chooser, guest email request, grade on Speak Submit text (no Whisper), Groq→DeepSeek grade fallback, Speak idle auto-pause.
- **This session:** Fixed black **You** tile while the camera LED stayed on (`f838b80`). Lobby now releases the webcam when the Interview starts (and on unmount). Call-screen `useCameraStream` uses a callback ref, calls `play()`, and starts/stops the stream with the Camera toggle so a remounted `<video>` is not left empty.
- `/`: Poppins guest-first hero, **Try as guest** → choice (continue / leave email / already-sent). Lobby → 15s → `/call?guest=1`. Header **Participant login** → Google dialog on `/login`.
- `/call`: Guest 3Q; Participant bank + follow-ups. No guest banner. Help the study Participant-only. Dev Skip interview still present.
- Scoring: `POST /api/score` → Groq → DeepSeek → `report: null`. Optional `DEEPSEEK_GRADE_API_KEY`. `check-env` still requires only `GROQ_GRADE_API_KEY`.
- Untracked on purpose: learning-map, scoring/session notes, ui-ux-review, prototype HTMLs, `personal.md`.
- Join→lobby Camera on→Skip→`/call` preview path browser-checked (live stream, `videoWidth` 640). Paid Deepgram/Groq/DeepSeek full Interview not agent-run this session.

---

## Open Tasks
**CSC 492 / testers:** join-link ops if needed, Issue 29 human items, Issue 15 deploy. Formal docs / oral exam later.
**CSC 485:** research question — deferred.

1. Live-verify `/join?from=<code>` if not done. After Netlify, update Google origins + Supabase Site URL.
2. Live-verify Guest or P001: Delivery Clear enough / Needs practice when transcript is complete, Answer Quality `source: "grade"` (Groq or DeepSeek — not unavailable). Click Answer again + Hear again once. Ask before paid Deepgram/Groq/DeepSeek.
3. Confirm Participant Skip + Submit → two research-form rows with `P-`. Guest does not POST Help the study.
4. Native Burmese review of remaining MY drafts.
5. Instructor written yes/no on RSU / CSC 485 consent.
6. Unpublish old n8n **NihonGo grade** webhook.
7. Optional Netlify: `DEEPGRAM_STT_API_KEY` (Member), `DEEPSEEK_GRADE_API_KEY` (+ ~$2 credit), `ELEVENLABS_TTS_API_KEY` only to regenerate clips.
8. Remove **Skip interview** before Issue 15; Netlify deploy; move Supabase / Google off `localhost`.
9. Paste `003_full_session_requests.sql` so Guest email save succeeds.
10. Phase 3 root CSS. Not a deploy blocker.
11. Mobbin polish (not a blocker).
12. CSC 485 research question — later.
13. User-count proof: Google Form N; `P00x` people; do not count Guest `G-` as unique students.
14. Later: one Groq critique per rubric category.
15. Later: live Burmese on the report (new translate path — `/api/translate` removed).
16. Later: InterviewReport refresh / draft resume after tab close.
17. Later: Guest session cap.
18. Later: Google account chooser brand name after public site + brand verification.
19. Later: soft dock hint if testers miss auto-pause (no modal).

---

## Fold into CLAUDE.md later
- **Participant login is a dialog on `/login`.** Soft nav via `@modal`; hard visit shows start screen behind the dialog.
- **Pitch route is gone.** Do not restore `/pitch`, `?pitch=1`, access key, or `pitchAnswers.ts`.
- **Guest email request** → `full_session_requests` only. Already-sent dialog step when this visit already sent.
- **Grade path:** Groq primary → DeepSeek Flash secondary → unavailable. Speak Submit text only. No Whisper.
- **Answer again:** visible label Answer again; secret cap 1; same STT engine on redo.
- **Speak idle:** auto-pause after 10s with no new transcript; no popup.
- **Report chrome:** Overview then Review. No guest banner on `/call`.
- **Dead routes removed:** `/api/translate`, `/api/stt`, Scribe env. `check-env` = `GROQ_GRADE_API_KEY` only.
- **Lobby camera:** stop lobby tracks when Interview starts / on unmount; do not leave a second live getUserMedia against `/call`. Call Camera toggle must stop/restart the stream and reattach + `play()` on remount.

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
| 2026-09-22 | Groq→DeepSeek grade fallback; hide Answer again count; Speak idle auto-pause (`a3fe96c`…`dd20428`, 509 tests) | DeepSeek Flash, thinking off. Both miss → unavailable (not sample Ready). Answer again cap 1, label only. Idle 10s → Pause; no popup. Do not force browser STT on redo. |
| 2026-09-22 | Fix black You tile while camera still open (`f838b80`, 513 tests) | Lobby releases webcam before `/call`; call hook reattaches + `play()` on remount; Camera toggle stops/restarts stream. Continuity/closed-lid miss stays a device note, not this leak. |
