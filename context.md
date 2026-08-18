# Chat Context Handoff

## Purpose

Preserve grill-me decisions across sessions. Continue the interview from the last unresolved question. Do not reopen locked branches unless the user explicitly asks.

Update this file only after every 5 grill-me answers, except when a product-direction change voids locked branches.

## Session metadata

- Workspace: `/Users/kyawnainglin/Documents/nihongo-mock-interview`
- Product name: **NihonGo**
- Subtitle: Japanese language school interview practice
- Skill in progress: grill-me
- Product option: **A — student-only school interview practice**
- Option B (student + agency, COE, Job Interview track) is void
- Next skill after grill-me completes: ubiquitous-language, then write-prd, then Blueprint Launch Pack (zero operational app code)
- Do not write a PRD, blueprint, or application code until grill-me confirms shared understanding
- Last context.md batch: `/api/translate` + Gemini; n8n grades in-workflow; `/api/grade` fallback; locked color palette
- Grill-me status: major product branches resolved. Ready for ubiquitous-language, then write-prd.
- Practice vs event: build the full working product now for the team. On 29 Aug 11:00–17:00, rebuild from a Launch Pack. Do not submit a finished app built before 11:00.
- “6-hour demo” means the hackathon build window 11:00–17:00. The 18:00 pitch is about 90 seconds (50 teams share 18:00–19:30). The interview itself is the 3-question live path.

## How to continue

Paste this into the next session if needed:

```text
Continue grill-me from the last unresolved question.
Use the locked decisions in context.md.
This is option A only: student-only language school interview. Product name is NihonGo.
Do not reopen resolved branches unless I explicitly ask.
Do not update context.md until I have answered 5 more questions, unless a lock is voided.
```

## Locked decisions

Treat these as fixed.

### Goal and scope

- First version is a 6-hour hackathon demo that proves the sponsor stack, not a full learner training product.
- Product name: **NihonGo**. Subtitle: **Japanese language school interview practice**.
- Do not print N5, JLPT, or A1 on the splash, Zoom bar, or report headline. Students see “practice the school interview,” not “an N5 test.”
- The 3 questions can still be beginner-level inside the engine (simple です/ます). That is implementation, not the product name.
- Main judged lane is Japan, not Korea.
- One track only: Language School Interview. The student is the only user.
- No Job Interview track. Judges who test get the same school interview, not a second product.
- No agency user. No Agency Review. No COE submission decision.
- This app is a coaching aid, not an official admissions or immigration body.
- One student only: Aung Min Khant. 1-click for the live path. Same school interview for pitch and for judges who test. Zaw Lin Htet is dropped.

### Language School Interview

- Scenario: school admission interview. Not embassy/visa officer. Not a combined embassy + school sequence.
- Engine target remains beginner です/ます. Do not brand the product as an N5 test.
- Language HUD on the call: huge Japanese captions. Tanaka-sensei always has pre-written Japanese + English + Burmese. Student Japanese comes from Wispr or typed text. Pitch path (Aung Min Khant clips): pre-written English + Burmese under that Japanese. Testers / live mic / typing: live English only under Japanese. No live Burmese in the 11:00–17:00 build.
- Candidate input: voice primary, typing fallback on the same screen.
- Live interview length: 3 questions, then practice report, sized for the ~90-second 18:00 pitch.
- Strictly one answer, then the next question. No spoken follow-ups.
- Live path: Q1 → answer → Q2 → answer → Q3 → answer → practice report.
- If an answer is thin, do not ask again. Put it on the practice report as coaching.

Exact interviewer questions:

1. Self-Introduction (自己紹介): 「はじめに、簡単に自己紹介をお願いします。」
2. Motivation (志望動機): 「どうして日本で日本語を勉強したいのですか。この学校を選んだ理由も教えてください。」
3. Post-Study Plan (卒業後の進路): 「日本語学校を卒業した後は、何をする予定ですか。」

### Interviewer persona

- Name: Tanaka-sensei（田中先生）
- Role: AI school admissions officer, Tokyo Pathway Japanese School
- Tile: generated illustration placeholder. Simple, professional, not photoreal. Not a real photo, not a silhouette.
- Label: `Tanaka-sensei · AI · Admissions`. Tokyo Pathway Japanese School under the name.
- One image generated or picked before build day and dropped in `/public`. Do not generate faces during the interview. Do not lip-sync.
- What you hear: the 3 locked Japanese questions via ElevenLabs TTS
- Waveform + Japanese captions show who is talking. The face sits still like a Zoom profile picture.
- Same officer for the pitch and for anyone who tests
- Not a classroom Japanese teacher, not a real school employee, not a visa officer, not a JLPT examiner

### Fictional school

Do not use a real school name.

- Name: Tokyo Pathway Japanese School（東京パスウェイ日本語学校）
- Location: Tokyo, near Akihabara
- Course: student-visa Japanese course, beginner class
- True features the good applicant can name:
  1. Career guidance toward IT vocational school after graduation
  2. Tokyo campus, not Osaka
  3. Small class with a beginner-to-intermediate study path

### Start screen and session

Flow:

1. NihonGo splash / start
2. Aung Min Khant card already loaded (read-only: name, age, hometown, education, plan, sponsor)
3. Join interview → Zoom-like call with Tanaka-sensei

No typing the form. No second sample student. Pitch: show the card for a few seconds, then Join. Judges who test use the same screen and the same Join.

No sign-up, no password, no guest email. Session lives in the browser until refresh. Saving interviews to a user account is out of the 11:00–17:00 build.

Desktop browser only (laptop / external monitor). No phone layout. If someone opens it on a phone, a simple “Open on a computer” message is enough. Do not spend 11:00–17:00 on responsive Zoom.

### Zoom-like interview UI and visual signature

The call can look like Zoom (two tiles, camera/mic toggles). It must not feel like only Zoom.

- Student video tile + interviewer tile
- Camera on/off toggle
- Mic on/off toggle
- Pitch defaults: camera on, mic on
- If the browser blocks the camera, show a Zoom-style “camera off” placeholder and still start the interview. Do not trap the demo on a permission dialog.
- Camera is for presence only. It does not change the score. Scoring still comes from speech.

Locked visual signature:

- Language HUD on the call: huge Japanese captions for sensei and student
- Sensei subtitles: always pre-written Japanese, English, and Burmese for the 3 questions
- Student subtitles: Wispr/typed Japanese always. Pitch clips: pre-written English + Burmese. Everyone else: live English only. Live Burmese is production, after the loop works
- Waveform that clearly switches: Tanaka-sensei speaking vs the student speaking
- After Q3: six scores animate as a radar, then a large stamp — 準備OK / もう少し / 要練習 — matching Ready / Almost Ready / Keep Practicing
- Live transcript in the sidebar

Build order: voice in/out first, then HUD + radar + stamp. Without the HUD and stamp, the demo looks like a video call plus a form.

### Typing fallback (same screen)

Voice is still primary. Do not send them to another page.

- Mic on: they speak. A small **Type instead** control stays visible.
- Mic off: an answer box appears at the bottom of the same call (like Zoom chat, but it is the answer).
- Voice fails (no transcript): the same box slides in. They type and send. The interview continues Q1 → Q2 → Q3.
- Typed answers: no Scribe. Score that answer’s Speaking from the text only. Do not invent a second Speaking rubric. Pronunciation is not scored for that answer (do not store it as 1).
- For a typed answer, Speaking 1–5 is only: did they answer this question, and is the Japanese understandable (です/ます, complete sentences)?
- On the report, one coaching line: “This answer was typed, so pronunciation was not checked.”
- Mix of voice + type: Scribe on the spoken clips, text-only Speaking on the typed ones, then average. Headline rules stay the same.
- For the 18:00 pitch, do not speak live Japanese. Hold a phone to the laptop mic and play each pre-recorded clip after Tanaka-sensei finishes. NihonGo treats that as a normal live speaker (Wispr + Scribe). Headphones on the laptop so sensei TTS does not leak into the mic. Stay muted in the hackathon call. Tab share with audio. Do not let the next clip overlap sensei.
- Do not put a Play answer button on the call. Clips stay on the phone, not in the UI. Do not build Play answer unless leftover time.
- If the phone audio is unclear: Type instead and paste the same 3 lines.
- Judges who test: speak if they can, or Type instead. No sample-clip button.

### Stack (11:00–17:00)

Locked stack: **Next.js + TypeScript + Tailwind only, hosted on Netlify.** No shadcn/ui, no component library.

- No database, no Auth. Start screen → Join.
- Next.js API routes on Netlify for ElevenLabs TTS, Scribe, `/api/translate`, and `/api/grade` so keys stay off the client.
- Wispr Flow for live HUD captions; browser speech fallback with the same payload shape if Wispr keys are missing.
- n8n grading webhook after Q3: n8n runs **Gemini 2.5 Flash inside the workflow**. n8n does not call `/api/grade`.
- Local grading fallback: `/api/grade` in Next.js, same Gemini model, same rubric prompt, same JSON shape, if n8n > 5s or fails.
- Tester live English: `POST /api/translate` in Next.js → Gemini 2.5 Flash. Separate from n8n. Pitch path does not call translate.
- `GEMINI_API_KEY`. Groq is a named backup only if Gemini is slow or 429s. Do not split providers on day one.
- Rubric prompt lives in two places (n8n + `/api/grade`). Keep one copy in `docs/` or `mocks/` and paste into both.
- Mobbin is UI reference only, not code.

If Netlify’s Next adapter blocks deploy, switch UI to Vite + React + TS + Tailwind on Netlify and keep Netlify Functions for ElevenLabs. Same product. Start with Next.js.

### Sponsor integrations and fallbacks

- Wispr Flow (or browser fallback with the same payload shape) = live HUD captions. Do not use Scribe for live captions.
- ElevenLabs TTS = Tanaka-sensei voice (one Japanese voice in the app). Student pitch clips = a **different** ElevenLabs Japanese voice on the phone. If both are the same voice, it sounds like one person answering themselves. Generate the 3 locked Aung Min Khant lines before 11:00 on event day and put them on the phone. Do not improvise on the day.
- ElevenLabs Scribe runs in the **background**. Do not make the student wait before Q2 or Q3. No pause, no spinner, no score on the call. After each spoken answer, send the clip to Scribe and keep going. Tanaka-sensei asks the next question as soon as the student is done (voice or type).
- After Q3, then wait: finish any in-flight Scribe jobs (or drop Scribe if late), then n8n / LLM builds the report. A short “scoring…” on the way to the report is fine. If Scribe is slow or fails, score Speaking from the Wispr transcript only and still show the report.
- Pronunciation counts inside Speaking only. Not a seventh /100 category. Not its own pass/fail. Speaking stays 20 points. Speaking ≤ 2 still → Keep Practicing.
- If it is ~15:00 and the call is still shaky, **cut Scribe** and let the LLM score Speaking from the transcript only. Do not sink the demo for pronunciation.
- n8n grading webhook after Q3. Wait **5 seconds**. Then `/api/grade` (same Gemini + same rubric JSON). Do not retry n8n. Never block more than 5 seconds for the webhook.
- Ping n8n when they hit **Join** (empty/health request) so the workflow is warm before Q3.
- Tester live English: after Wispr Japanese, `POST /api/translate` `{ japanese, context: "school interview answer" }` → `{ english }`. Background. Fail or timeout → no English line, no crash. Pitch path uses pre-written English and does not call translate.
- If the microphone or transcript fails, that is a demo failure, not a student failure. Load the canned good Aung Min Khant transcript and show the matching good practice report. Do not score silence or garbage audio.
- Interview sound effects are not required. Leftover time only.

### Design tokens

Lock now. Do not re-pick during 11:00–17:00 except if contrast fails on the projector.

| Role | Name | Hex | Use |
| --- | --- | --- | --- |
| Primary | Indigo | `#4F46E5` | Waveform (student), Join, focus rings, radar fill |
| Surface | Ink | `#0F172A` | Call background, HUD bar |
| Caption | Paper | `#F8FAFC` | Japanese + EN/MY text on dark HUD |

Stamp:

| Headline | Color | Hex |
| --- | --- | --- |
| Ready / 準備OK | Green | `#22C55E` |
| Almost Ready / もう少し | Amber | `#F59E0B` |
| Keep Practicing / 要練習 | Red | `#EF4444` |

- Dark call UI (Ink background).
- Sensei waveform: Paper at ~60% opacity (not Primary).
- Put these in `tailwind.config` / CSS variables in the blueprint. On the day, only implement.
- During 11:00–17:00: spacing, font size, animation timing only.

### Practice report (student only)

No scoring or diagnostic corrections during the interview. Sidebar during the interview: progress/status and live speech transcription only. Report appears only after all 3 questions.

Headline: **Interview Readiness — Ready / Almost Ready / Keep Practicing**  
Japanese stamp: **準備OK / もう少し / 要練習**  
Do not print Pass or Fail. Do not print N5, JLPT, or A1 on the report headline. Do not accept or reject anyone for COE.

Skip reading, writing, and a 10-question N5 test in the 6-hour build. Voice only.

Under the headline, a school-style score sheet. Each category is 1–5. Total /100. After Q3 the six scores animate as a radar, then the stamp.

| Category | Weight | Taken from |
| --- | --- | --- |
| Speaking | 20 | Fluency, pronunciation/clarity (Scribe if live), can they introduce themselves |
| Listening | 15 | Did each answer actually match the question asked |
| Grammar & politeness | 15 | です/ます, basic particles, not casual/broken |
| Motivation | 20 | Q2: why Japan, why this school, not anime/money/agent |
| Study plan | 20 | Q3: next step, language target, realistic |
| Consistency | 10 | Spoken answers vs the 1-click profile |
| **Total** | **100** | |

Formula: `(score / 5) × weight`, then sum. Do not use equal weight. Language is 50. Motivation + plan + consistency is 50.

**Ready / 準備OK:** Japanese is understandable, motivation and plan are specific, matches profile.

**Almost Ready / もう少し:** they got through the 3 answers but were weak (about Speaking 3, or one thin content area). Still a student story.

**Keep Practicing / 要練習:** cannot communicate, or work/money is the real story, or answers fight the profile.

Gates (override the number):

- Speaking ≤ 2 → **Keep Practicing**. Headline cannot be Ready or Almost Ready. If the story was fine, the report says the gap is Japanese (speaking, listening, です/ます), not the life plan.
- Motivation ≤ 2 **or** study plan ≤ 2 (vague / work / money) → **Keep Practicing**, even if Japanese is strong.

Coaching notes: です/ます and beginner grammar are allowed. Exam labels stay off. Notes can look like: use です/ます not casual だ/る; particle は vs を; add one more sentence to the self-intro; beginner pattern たいです / てください. Do not write N5, JLPT, A1, “N5 pass,” or “CEFR A1.” Notes teach Japanese. They do not certify a level.

No Ready to Submit / Needs Coaching / Hold Application. No Application Readiness Risk. No Agency Review.

### Demo profile

- Live pitch student: Aung Min Khant. 1-click pre-filled profile. No live form-filling during the pitch.
- Judges who test get the same school interview as the student.

#### Strong applicant (default, live interview)

- Name: Aung Min Khant
- Age: 23
- Hometown: Mandalay, Myanmar
- Highest education: B.C.Sc, University of Computer Studies, Mandalay (graduated 2025)
- Current job: Not employed. Preparing for study in Japan. Helps in his parents’ shop part-time in Mandalay; this is not his career plan.
- Written study purpose: Study Japanese in Tokyo to enter an IT vocational school. Chose Tokyo Pathway Japanese School because it is near Akihabara, has a beginner class, and offers career guidance toward IT senmon gakko. Not going for part-time work.
- Post-graduation plan: After language school, enter a Tokyo IT vocational school (web / software). Then look for an engineer job in Japan. Study first, then visa change if needed.
- Language goal: beginner now. Target N2 in 18 months (internal profile field; do not put N5/JLPT on splash, Zoom bar, or report headline).
- Study duration: 1 year 6 months at Tokyo Pathway Japanese School.
- Financial sponsor: Parents. Father: U Ko Ko Khant, company employee in Mandalay. Mother: Daw Khin Htay, shop owner.

What he should say:

- Intro: name, 23, Mandalay, computer-science graduate, beginner Japanese, 6 months of study, goal is IT vocational school in Tokyo.
- Motivation: this school, Akihabara, IT pathway, not anime / money / “my agent chose it”.
- After graduation: senmon gakko, then engineer. Not “I will decide later” and not work-only.

### Evaluator signals still used for coaching

These remain as coaching signals in the student practice report. They are not COE hold/submit decisions.

Self-introduction rewards: name, age, origin, education/job, Japanese study period and current level, one goal sentence, document consistency, understandable polite です/ます Japanese.

Self-introduction flags: cannot give basic personal info, document mismatch, robotic memorized speech, work/money focus, “live in Japan forever” with no study plan, very short or evasive answers.

Motivation rewards: specific study/career-linked reason, why Japan, consistency with background, researched school features, goal-school match, non-money-focused reasons.

Motivation flags: vague “I like Japan/anime”, work/money as main reason, no post-school plan, document contradictions, “my agent chose this school”, cheap/easy part-time work as the school reason, cannot name school features, wrong school information.

Post-study plan rewards: specific next step, Japanese linked to the plan, realistic timeline and language target, consistency with earlier answers, study-first then visa change if needed.

Post-study plan flags: “I’ll decide later”, work/money-only plan, vague/unrealistic study plan, contradictions with earlier answers, working many hours instead of studying.

## Voided locks (option B)

Do not follow these unless the user explicitly reopens them.

- Student + agency dual report
- Agency Review + COE submission recommendation
- Ready to Submit / Needs Coaching / Hold Application as product outcomes
- Application Readiness Risk as a visa/COE label
- Job Interview track, start-screen option, or separate job engine
- Zaw Lin Htet and any high-risk canned Hold Application report
- HanGo! as the product name
- ElevenLabs TTS-only with Scribe permanently cut (Scribe is now in-scope for Speaking clarity, with a 15:00 cut if the call is shaky)
- Phone-first or responsive Zoom layout
- User accounts, login, or saved interview history
- Presenter speaking live Japanese on the 18:00 stage
- An in-app Play answer button

### 18:00 pitch path (~90 seconds)

The presenter cannot speak Japanese live. Do not skip to the report. Do not put Play answer on the call.

18:00 method: hold the phone to the laptop mic and play each clip after Tanaka-sensei finishes. NihonGo treats it as a normal live speaker (Wispr + Scribe). Phone playback is the presenter’s voice, not a special feature. Build the app as live mic.

Headphones on the laptop so sensei TTS does not leak into the mic. Stay muted in the hackathon call. Tab share with audio. After each question: play one clip on the phone, close to the laptop mic, then stop. Do not let the next clip overlap sensei.

Lock the 3 clips on the phone (make them before hackathon day):

1. 「アウン・ミン・タントです。23歳、マンダレーから来ました。コンピューターを勉強しました。ITの専門学校に行きたいです。」
2. 「東京パスウェイは秋葉原の近くです。ITの進路指導があります。この学校で日本語を勉強したいです。」
3. 「専門学校でウェブを勉強します。そのあとエンジニアになりたいです。」

Already done before being called: Chrome, desktop, headphones, NihonGo on the start screen, Aung Min Khant loaded. Hackathon call: camera on if the host wants the presenter’s face; presenter is muted. Tab share with audio is ready. Do not share the whole desktop.

Clicks: **Join only** → wait → wait → wait → report. No extra in-app clicks.

If the phone is unclear: Type instead and paste the same 3 lines. Still no live Japanese speaking.

Share this URL when presenting (tab already on start screen): `https://<netlify-url>/?pitch=1`

What `?pitch=1` does:

- The call still runs live (phone → mic → 3 answers).
- If the result is Ready / 準備OK, show that live report.
- If not, swap only the last screen to the canned good Aung Min Khant report. No new tab, no re-Join.
- Without the flag, judges who test get an honest live score, including a weak one.
- Do not start the pitch on a URL without `?pitch=1` and add it later. A reload in those 90 seconds kills the demo.

### Practice now vs hackathon day

- Now: build the full working NihonGo for practice with the team. Do not decide the event-day file list until that app works.
- Before 11:00 allowed as prep: product decisions, architecture/blueprint, API contracts, mock JSON, design assets, pre-generated pitch clips, evaluator rubric, `.env.example` with key names only.
- Forbidden as the hackathon deliverable: a finished deployed app, a full working interview-loop repo you only tweak, copy-paste of the practice repo into the submission.
- On 29 Aug, 11:00–17:00: rebuild from the Launch Pack. Same product, built during the event.
- Launch Pack is extracted **after** the practice app runs end-to-end. Until then, no `app/` / `src/` / deployable interview UI in what you bring to the event (unless the hackathon later allows starter code).

## Last unresolved question

None. Major product branches are resolved. Ready for `/write-prd`.

## Open branches still to grill

None that block a PRD. Leftover-time only: interview sound effects, Play answer, shadcn after the hackathon, live Burmese for testers.

## Explicitly not this version unless reopened

- Korea / EPS-TOPIK as the main judged flow
- A full usable learner training product as v1
- Live scoring or Keigo diagnostics shown during the interview
- A Job Interview track
- Spoken follow-up questions during the live interview
- Agency Review, COE decisions, or official immigration labeling
- Using a real language school name
- Treating the app as an official immigration or admissions authority
- Scoring silence or garbage audio as a student failure
- A second canned high-risk student profile
- Equal-weight scoring
- Reading, writing, or a 10-question N5 test in the 6-hour build
- Blocking the demo on a camera-permission dialog
- Printing N5, JLPT, or A1 on the splash, Zoom bar, or report headline
- Using Scribe for live captions (Wispr / browser fallback owns captions)
- Interview sound effects as required work
- Sending typing to a separate page
- Sign-up, password, guest email, or account-saved interviews
- Spending 11:00–17:00 on a phone Zoom layout
- An in-app Play answer / play-the-student control
- shadcn/ui or another component library in the 11:00–17:00 build
- Live Burmese translation of tester answers in the 11:00–17:00 build
- Submitting a finished app built before 11:00 as the hackathon deliverable
- shadcn/ui in the 11:00–17:00 build
- Browser translation APIs or a dedicated DeepL/Google Translate account
- n8n as a pass-through that only calls `/api/grade`
- Picking HUD colors during 11:00–17:00
