# NihonGo product context
> `/end-session` updates this file when a product-direction change voids a lock.
> Do not open `context.md`. That file is the frozen 2026-08-28 grill archive. Later builds superseded parts of it (voice-only, Groq-only grade, no n8n, no Profile card, no school name on learner UI, committed mp3s, Guest / Participant / Pitch split).

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
- `/` is Guest practice: **Try as guest** opens `/guest` directly (device join is the page, not a dialog over `/`) → 15s popup on `/guest` → `/call?guest=1`, the 3 locked Questions only. Question 1 auto-plays when `/call` paints. No **Start interview** button on `/call`. The email form is only on the Guest report (`form` then `saved`). If this visit already sent, the report does not open the form. This app saves the address in `full_session_requests` only. No admin route and no mail from this app. No topic bank and no follow-ups. No glance pills (Speak in Japanese, Coaching report, 10–15 min). **How it works** stays. **Participant login** is a header pill that opens a dialog on `/login` over the start screen. The URL is still `/login`. The dialog is Google-only: no Try as guest, no guest-practice note, and no ENG/MM inside the dialog. Header ENG/MM stays. `/consent` Join stays **Join interview** and overlays the same landing-style join card, then the 15s popup, then `/call`, the 10-topic bank plus follow-ups.
- Join UI (shared): compact camera/mic card on paper/feather, not Meet-dark. `/guest` is a public paper-green page (`guestJoin`). `/call` classroom look is separate.
- Participant entry is Google only: allowlisted `/login`, or an open `/join?from=CODE`. Consent is required this visit. Magic-link login is gone. `/join` with no `from`, or an unknown invite code, shows the Next not-found page. An open join link shows the same landing as `/` with **Login** only, and no glance pills. **Login** opens **Join NihonGo**; **Continue with Google** keeps the invite code. The line under the button is “Invited testers sign in with Google using the email on the list.” The dialog has no ENG/MM. Close stays on that URL. `/login` has no invite code: Google continues only when the email is already invited or the person is already a Participant. Do not put **Try as guest** or the header **Participant login** pill on the join link.
- Sensei audio is committed `/question-{id}.mp3`. No runtime TTS.
- Eng/MM picks one helper language. Japanese stays on the HUD. Do not stack EN and MY.
- Grade is Groq on the Speak Submit transcript (live caption the student confirmed), then optional DeepSeek Flash (`thinking` off) on any Groq miss. Both miss → scoring unavailable (no live sample Ready). ASR-aware rubric prompt: grade meaning, do not punish caption glitches, do not invent a cleaner transcript. No Whisper overwrite. Speaking is not a score. Speech Delivery Signals are browser timing on answered Questions. Skip interview may still use a local sample for preview only.
- Answer again is one pre-Submit redo per Question. Dock shows **Answer again** (no retry count). Same STT engine on the kept take. Speak auto-pauses after 10s with no new live transcript (same as Pause; no popup).
- InterviewReport is Overview (stamp / radar / delivery) then Review (question nav + one card). No guest practice banner on `/call`.
- Help the study is for Participant reports only. A Try as guest report (`/call?guest=1`) does not show the button or the dialog. Session codes are `G-` / `P-`.
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

None that reopen a locked branch. Next step is pasting `003_full_session_requests.sql`, then the open tasks in `claude2.md` (join-link Google through consent, then Issue 15 deploy). The join landing and dialog are checked; invalid join links are tested to return not-found. CSC 485 research question is later. The Guest session cap stays later.

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
