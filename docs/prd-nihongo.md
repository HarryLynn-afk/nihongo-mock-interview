# PRD — NihonGo School Interview Practice
**Status:** Ready for /write-issues
**Date:** 2026-08-18
**Built by:** Kyaw Naing Lin

---

## Problem
Myanmar students preparing for a Japanese language-school admission interview cannot rehearse the real Zoom-like pressure: spoken Japanese questions, a visible profile, and a school-style score sheet afterward. If that stays unsolved, they either memorize English talking points or walk into the real interview unprepared. This first version also has to prove a sponsor stack (Wispr, ElevenLabs, n8n, Cursor, Mobbin, Netlify) in a 6-hour hackathon build and a ~90-second 18:00 pitch.

## Goal
On a desktop browser, a student (or judge) can Join a 3-question live call with Tanaka-sensei, answer by voice or type, and see an Interview Readiness report (Ready / Almost Ready / Keep Practicing plus stamp 準備OK / もう少し / 要練習, six scores, radar, coaching notes) without leaving the app.

## Users
The only user is the student practicing a language-school admission interview.

- Pitch persona: Aung Min Khant (1-click read-only profile).
- Judges who test: same school interview, same Join. They speak if they can, or Type instead.
- Not an agency counselor, school staff, embassy officer, or logged-in account holder.

## Requirements

### Must Have
- Product chrome shows **NihonGo** and subtitle **Japanese language school interview practice**. Splash, Zoom bar, and report headline never print N5, JLPT, A1, Pass, or Fail.
- Start screen → read-only Aung Min Khant card (name, age, hometown, education, plan, sponsor) → **Join interview**. No live form. No second sample student.
- Desktop Chrome only. Phone visitors see a simple “Open on a computer” message. No responsive Zoom layout.
- No sign-up, password, or guest email. Session lives in the browser until refresh. Interviews are not saved to an account.
- Call UI: student tile + Tanaka-sensei tile, camera on/off, mic on/off. Defaults camera on, mic on. If the camera is blocked, show a “camera off” placeholder and still start. Camera does not affect the score.
- Tanaka-sensei is a still illustrated avatar labeled `Tanaka-sensei · AI · Admissions` with Tokyo Pathway Japanese School under the name. One image in `/public`. No live face generation. No lip-sync.
- Dark call UI using locked tokens: Ink `#0F172A`, Paper `#F8FAFC`, Indigo `#4F46E5`. Student waveform Indigo; sensei waveform Paper at ~60% opacity. Stamp colors: Ready `#22C55E`, Almost Ready `#F59E0B`, Keep Practicing `#EF4444`.
- Language HUD: huge Japanese captions. Sensei always has pre-written Japanese, English, and Burmese for the 3 locked questions.
- Student Japanese comes from Wispr (or typed text). Testers / live mic / typing: live English only via `POST /api/translate`. No live Burmese in this build.
- On `?pitch=1`, after Q1/Q2/Q3, always show the **pre-written English + Burmese for that question index**. Do not fuzzy-match Wispr text. Question index is enough.
- Waveform switches when sensei vs student is speaking. Sidebar shows progress/status and live transcript only. No scores on the call.
- Exactly these 3 questions, one answer each, no spoken follow-ups:
  1. 「はじめに、簡単に自己紹介をお願いします。」
  2. 「どうして日本で日本語を勉強したいのですか。この学校を選んだ理由も教えてください。」
  3. 「日本語学校を卒業した後は、何をする予定ですか。」
- Voice is primary. **Type instead** stays visible when mic is on. Mic off or no transcript: answer box on the same call. Typed answers skip Scribe; Speaking 1–5 is “answered the question?” + understandable です/ます. Report line: “This answer was typed, so pronunciation was not checked.”
- ElevenLabs TTS speaks Tanaka-sensei (one Japanese voice). If TTS latency exceeds 1.5s, fall back to pre-rendered local `.mp3` while keeping the ElevenLabs contract. Student pitch clips are a **different** ElevenLabs Japanese voice on the presenter’s phone, not in the UI.
- Wispr (or browser speech with the same payload shape) owns live HUD captions. Scribe is not used for captions.
- After each spoken answer, send the audio clip to ElevenLabs Scribe in the background. Do not wait, spinner, or score before Q2/Q3. After Q3, finish or drop late Scribe, then grade. If Scribe fails, score Speaking from the Wispr transcript.
- After Q3: ping-warmed n8n webhook grades with Gemini 2.5 Flash **inside n8n**. Wait 5 seconds, no retry. Fallback: `POST /api/grade` in Next.js, same Gemini model, same rubric, same JSON. n8n does not call `/api/grade`.
- If both n8n and `/api/grade` fail after 5 seconds, show a static **sample Ready report** from `mocks/sample-report-ready.json` with a small banner: “Scoring unavailable — sample report.” Never a blank screen or infinite spinner. The same JSON backs the canned good Aung Min Khant last-screen fallback on `?pitch=1`.
- After Q3, the report **Must** show an animated radar chart of the six scores, then a large stamp (準備OK / もう少し / 要練習), then coaching details. Radar library vs custom SVG is not locked; the animated reveal is required.
- Report headline **Interview Readiness** with stamp 準備OK / もう少し / 要練習. Six 1–5 scores weighted to /100: Speaking 20, Listening 15, Grammar & politeness 15, Motivation 20, Study plan 20, Consistency 10. Formula: `(score / 5) × weight`, then sum.
- Listening = whether each answer addressed the question that was asked (comprehension). It is not a separate audio exercise.
- Headline rules (n8n and `/api/grade` must use the same table):
  - **Keep Practicing / 要練習:** any gate fires.
  - **Ready / 準備OK:** no gate; total ≥ 75; Speaking, Motivation, and Study plan all ≥ 4.
  - **Almost Ready / もう少し:** no gate; everything else.
- Gates: Speaking ≤ 2 → Keep Practicing (not Ready or Almost Ready). Motivation ≤ 2 or study plan ≤ 2 (vague / work / money) → Keep Practicing even if Japanese is strong.
- When Speaking ≤ 2 but motivation and plan are still a student story, coaching must say the story is fine and the gap is Japanese (speaking, listening, です/ます), not the life plan.
- Coaching notes may use です/ます and beginner patterns; never N5 / JLPT / A1.
- 18:00 opens `/?pitch=1` from the start. Presenter is muted in the hackathon call, headphones on the laptop, tab share with audio. Clicks: **Join only**. Phone plays the 3 locked clips into the laptop mic after each sensei question. No Play-answer button.
- On `?pitch=1`, show the live report only if Ready / 準備OK. Otherwise swap **only the last screen** to the canned good Aung Min Khant report. No reload, no re-Join. Without the flag, testers get an honest live score.
- If in-app mic/transcript fails on pitch: Type instead and paste the 3 locked lines. Do not score silence or garbage audio as a student failure.
- Fictional school only: Tokyo Pathway Japanese School（東京パスウェイ日本語学校）, Tokyo near Akihabara, beginner student-visa course. True features: IT vocational-school career guidance, Tokyo not Osaka, small class with beginner-to-intermediate path.

### Should Have
- Interview sound effects (join tone, report whoosh) if leftover time after HUD + radar + stamp work.
- In-app Play-answer control if leftover time (not for 18:00; 18:00 is phone → mic).
- Extra n8n translate workflow for sponsor visibility if leftover time (happy path stays `/api/translate`).
- Groq swap in `/api/translate` and `/api/grade` if Gemini is slow or 429s on event day. Do not split providers on day one.
- Event-day contingency: if the live call is still shaky around 15:00, cut Scribe and score Speaking from the transcript only. This is a build-checklist item, not a judge-facing requirement.

### Must NOT Have (explicit exclusions)
- Agency Review, COE submit/hold, Application Readiness Risk, Ready to Submit / Needs Coaching / Hold Application.
- Job Interview track or a second student profile (Zaw Lin Htet is dropped).
- Korea / EPS-TOPIK as a judged flow.
- Live scoring or Keigo diagnostics shown during the interview.
- Spoken follow-up questions.
- Printing N5, JLPT, A1, Pass, or Fail on splash, Zoom bar, or report headline.
- Treating the app as an official school, visa, or JLPT authority. Do not use a real school name.
- User accounts, login, guest email, or saved interview history.
- Database.
- shadcn/ui or another component library in the 11:00–17:00 UI.
- Phone-first / responsive Zoom layout.
- Play-answer or “play the student” control as a required 18:00 feature.
- Using Scribe for live captions.
- Browser translation widgets or a dedicated DeepL / Google Cloud Translate account.
- n8n as a pass-through that only calls `/api/grade`.
- Live Burmese translation of tester answers.
- Reading, writing, or a 10-question N5 test.
- Blocking the demo on a camera-permission dialog.
- Submitting a finished app built before 11:00 as the hackathon deliverable.
- Picking new HUD colors during 11:00–17:00 except projector contrast failure.

## Technical Constraints
- Stack: Next.js + TypeScript + Tailwind only, hosted on Netlify. No shadcn. Start with Next.js. If Netlify’s Next adapter blocks deploy, switch UI to Vite + React + TS + Tailwind on Netlify and keep Netlify Functions for ElevenLabs. Same product.
- No database, no Auth. Keys stay off the client: ElevenLabs TTS (`ELEVENLABS_TTS_API_KEY`) and Scribe (`ELEVENLABS_SCRIBE_API_KEY`) are separate scoped keys; Gemini translate (`GEMINI_TRANSLATE_API_KEY`) and grade (`GEMINI_GRADE_API_KEY`) are separate scoped keys; n8n webhook; Wispr. One key per purpose — never shared across features.
- n8n: grading only (Gemini 2.5 Flash node in the workflow) plus optional empty/health ping on Join. Translate is `POST /api/translate` → `{ japanese, context: "school interview answer" }` → `{ english }`. Background; timeout **3 seconds**, fail-open (hide English line, no crash). Pitch does not call translate.
- Rubric prompt is copied into n8n and `/api/grade` from one `docs/` or `mocks/` source so they stay identical.
- ElevenLabs TTS stream `/v1/text-to-speech/stream`; local `.mp3` fallback if latency > 1.5s.
- Wispr API keys may be missing; browser microphone transcription must use the same request/response shape.
- Desktop browser (laptop / external monitor). 18:00 path is ~90 seconds, 50 teams share 18:00–19:30.
- Practice now: full working app for the team. Event day 29 Aug 11:00–17:00: rebuild from a Launch Pack (plans, contracts, mocks, assets, rubric, `.env.example`). Do not copy-paste a done repo as the submission.
- Mobbin is layout reference only, not code.

## Open Questions
- Exact Wispr key/SDK availability on event day (browser-speech fallback is locked; the live Wispr integration is not proven yet).
- Exact ElevenLabs voice IDs for Tanaka-sensei and the student phone clips (must be two different Japanese voices).
- Whether the hackathon later allows any starter code in the submission repo (current lock: no operational `app/` / interview UI in what you bring).
- Radar chart implementation (library vs custom SVG). The animated radar + stamp reveal is required; the drawing method is not.

## Success Criteria
- A judge on a laptop can open the Netlify URL, see Aung Min Khant, Join, complete 3 answers (voice or type), and see **animated radar + large stamp** + six scores + coaching notes.
- 18:00 on `/?pitch=1`: Join only, three phone clips into the mic, report on screen in ~90 seconds. If the live headline is not Ready / 準備OK, the last screen is the canned good report without reload. On `?pitch=1`, student EN/MY HUD lines come from question index, not Wispr matching.
- HUD shows sensei JA/EN/MY and student Japanese; testers may get English under Japanese within 3s or no English line; missing English never crashes the call.
- No scores appear until after Q3. Thin answers are coached on the report, not with a follow-up question.
- n8n never blocks the report more than 5 seconds. If both n8n and `/api/grade` fail, the user still sees `mocks/sample-report-ready.json` plus the scoring-unavailable banner — never a blank screen or spinner.
- Camera-permission denial still starts the interview.
- Splash, Zoom bar, and report headline contain no N5 / JLPT / A1 / Pass / Fail. Coaching may mention です/ます.
- When Speaking ≤ 2 but motivation and plan are a student story, the report says the story is fine and the gap is Japanese — not a new life plan.
- Headline on a scored report matches the Ready / Almost Ready / Keep Practicing table (n8n and `/api/grade` agree).
- The pitch line “Practice for the student. Not a school decision.” matches the product: no COE recommendation is shown.

## Dependencies
- Grill-me shared understanding in `context.md`, kept in sync with this PRD (option A only).
- Tanaka-sensei illustration in `/public` before event day.
- Three student answer mp3s on the presenter’s phone, generated with a different ElevenLabs Japanese voice than sensei, using the locked Japanese lines.
- Pre-rendered sensei `.mp3` fallbacks for the 3 questions.
- Wispr (or browser fallback) for live captions; ElevenLabs for TTS and Scribe; n8n workflow with Gemini 2.5 Flash; Netlify host; Gemini key for `/api/translate` and `/api/grade`.
- Locked Aung Min Khant profile JSON, pre-written JA/EN/MY sensei subtitles, and pitch-path student EN/MY lines keyed by question index.
- `mocks/sample-report-ready.json` for dual-grade failure and the `?pitch=1` canned last screen.
- Launch Pack extraction happens only after the practice app runs end-to-end.
