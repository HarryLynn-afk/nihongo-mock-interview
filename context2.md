# NihonGo product context
> `/end-session` updates this file when a product-direction change voids a lock.
> Do not open `docs/archive/context-2026-08-28-grill.md`. That file is the frozen 2026-08-28 grill archive. Later builds superseded parts of it (voice-only, Groq-only grade, no n8n, no old Profile card on the landing, no school name on learner UI, committed mp3s, Guest / Participant / Pitch split).

---

## Academic target

**NihonGo** is a CSC 485 research evaluation and a CSC 492 working web app (code, test, deploy, docs, oral exam, presentation). The 29 Aug Launch Pack rebuild is void. The presentation path is **Try as guest**: the three locked Questions, then the coaching report.

## How to continue

```text
Continue NihonGo as a CSC 485 + CSC 492 project, not a hackathon.
Use the locked product decisions in context2.md.
Do not reopen resolved branches unless I explicitly ask.
Do not plan a 29 Aug Launch Pack rebuild.
```

## Locked now

- Product option A: one student, one track, Language School Interview. No agency, no COE decision, no Job Interview track. Coaching aid, not an admissions or immigration authority.
- Interviewer: Tanaka-sensei. School name Tokyo Pathway Japanese School stays in the locked profile fixture only. Learner UI does not show the school name.
- Three Questions, then the practice report on `/call`. Voice-only. A failed Speak retries up to 3 times, then the Question is skipped. No typing.
- `/` is Guest practice: **Try a short practice** opens the same in-page lobby dialog as Participant (no `/guest` route since 2026-10-01) → 15s overlay → `/call?guest=1`, the 3 locked Questions only. The email form is only on the Guest report (`form` then `saved`), saved in `full_session_requests`; this app sends no mail. No topic bank or follow-ups for Guest. No glance pills. **How it works** and header English/မြန်မာ stay. Header **Login** opens the Google dialog on `/login`; the dialog has no language toggle. After Google sign-in, return to `/` with **Join Interview** and a **Profile** icon/button; there is no guest practice while signed in. `/profile` shows Google name/email, optional participant ID, and Sign out. Consent appears after Join, before device setup and the participant `/call`.
- Join UI: compact camera/mic card on paper/feather, not Meet-dark, shown as a dialog over the landing for both Guest and Participant. The whole app (landing, `/call` classroom, report, post-call dialogs) is **one light brand theme** since 2026-10-01; the old dark ink/paper/indigo palette is gone.
- Participant entry is Google only: allowlisted normal landing or an open `/join?from=CODE`. Consent is required each sign-in visit before `/call`; the consent prompt opens from **Join Interview** on the landing, followed by the camera/mic popup and 15s reminder. Magic-link login is gone. `/join` with no `from`, or an unknown code, shows Next not-found. An open unique link shares the normal landing, including **Try a short practice** and Login; Google returns to that same URL with the invite code. A full link shows a dismissible popup over the landing; Login and Join remain hidden there, while Guest stays available. New testers use one capped-link slot on consent; returning testers use none. Sign out returns to the originating landing with Guest and Login visible. The flow diagram is `docs/participant-entry-flow.md`.
- Sensei audio is committed `/question-{id}.mp3`. No runtime TTS.
- Eng/MM picks one helper language. Japanese stays on the HUD. Do not stack EN and MY.
- Grade is Groq on the Speak Submit transcript (live caption the student confirmed), then optional DeepSeek Flash (`thinking` off) on any Groq miss. Both miss → scoring unavailable (no live sample Ready). ASR-aware rubric prompt: grade meaning, do not punish caption glitches, do not invent a cleaner transcript. No Whisper overwrite. Speaking is not a score. Speech Delivery coaching uses **Deepgram word timestamps** on answered Questions: only **mid-answer gaps ≥ 2.0s** produce a tip, there is no characters-per-second or pause count, and the labels Clear enough / Needs practice are gone. Template + evidence — one wording per measurement, no extra LLM call; browser STT (no timestamps) reports **Unable to assess**. Skip interview may still use a local sample for preview only.
- Answer again is one pre-Submit redo per Question. Dock shows **Answer again** (no retry count). Same STT engine on the kept take. Speak auto-pauses after 10s with no new live transcript (same as Pause; no popup). **Pause must not close the Deepgram socket**: one session per Speak attempt, mic starts in parallel with the handshake (audio buffers until open), pause sends `KeepAlive` every 8s and stops the mic, resume uses the same socket.
- InterviewReport is Overview (stamp / radar) then Review (question nav + one card). Speech Delivery lives inside each question card (tip / no-pause / unable-to-assess), not in a session panel. No guest practice banner on `/call`.
- Help the study is for signed-in reports only: any Google session shows it, Participant or Try as guest. An anonymous Try as guest report (`/call?guest=1`) shows the email ask instead of Help the study. Session codes stay `G-` / `P-`.
- Desktop-first. No shadcn/ui. No extra database beyond optional Supabase for study login.
- Build requires `GROQ_GRADE_API_KEY` only. Optional Deepgram, DeepSeek grade fallback, generate-time ElevenLabs TTS, research form URL, Supabase. No runtime translate / Wispr / Whisper / Pitch access key.

## Voided — do not reopen

- Hackathon, Launch Pack, 29 Aug, 18:00 pitch-as-submission
- Option B (agency, COE, Job Interview, Zaw Lin Htet, HanGo!)
- Typing, Speak or type, Profile card on `/`, `?pitch=1` on `/`
- Separate pitch route: `/pitch`, access key, scripted sample answers, `/call?pitch=1` as a classroom. Those URLs show the Next.js not-found page.
- Meet-dark join overlay on `/` (Guest join is `/guest`; shared lobby is landing paper/feather)
- Email choice before the Guest lobby (“How do you want to practice?”, leave an email, already-sent dialog). The address form stays on the Guest report.
- Landing glance pills (Speak in Japanese, Coaching report, 10–15 min) on `/` or valid `/join?from=CODE`
- ENG/MM inside the Google sign-in dialog, and the join-popup line “Sign in with Google to join this tester's practice group.”
- n8n grade webhook, warm ping, Gemini as the live grader
- Magic-link / SMTP login
- Pitch last-screen swap to a canned Ready report
- Printing N5, JLPT, or A1 on the splash, call bar, or report headline
- Phone-first layout, in-app Play answer, sign-up built only to inflate a user count

## Last unresolved

The full-link policy for returning participants remains a later product decision; the current app hides Login and Join on a full link. Next step is live-verifying Google sign-in from both landings through Join, consent, profile, and classroom; then the open tasks in `claude2.md` and Issue 15 deploy. Migration `004` has been applied. CSC 485 research question and the Guest session cap stay later.

## Explicitly not this version unless reopened

- Live Burmese of tester answers via `/api/translate` (route removed; would need a new path)
- One Groq critique per rubric category
- Gemini as a second grader, or removing the sample last screen (DeepSeek Flash is the chosen grade overflow; live sample Ready on miss is gone)
- Interview resume after tab close
- Guest 2-Interview cap
- Scoring-fallback UI (Retry) until that decision is chosen
- Google account-chooser brand name (“to continue to NihonGo”). The Supabase project URL on that screen stays until brand verification, after a public site exists.
- A cap on how many Guest sessions can run. Try as guest stays open until that cap is chosen.
- Background Whisper / `/api/scribe` / preferring a second ASR over Speak Submit text
- Unlimited Answer again, browser STT forced on Answer again, or a modal when Speak auto-pauses
