# Issues — NihonGo (from docs/prd-nihongo.md)

Vertical slices, foundation first. Build and hand to Claude Code in this order.
For each issue: `/build-plan` before starting, `/tdd` while building, `/after-task` when done.

---

## 1. Project scaffold, design tokens, env config

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** none

### Context
Nothing exists yet. Every later issue needs a running Next.js app, the locked
design tokens, and a place to declare required API keys without exposing them.

### Task
Initialize Next.js + TypeScript + Tailwind (no shadcn/ui, no other component
library). Add the locked design tokens to `tailwind.config` / CSS variables:
Ink `#0F172A`, Paper `#F8FAFC`, Indigo `#4F46E5`, stamp colors Ready `#22C55E`,
Almost Ready `#F59E0B`, Keep Practicing `#EF4444`. Add `netlify.toml` for the
Next.js runtime. Add `.env.example` listing key names only (no values):
`ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `N8N_WEBHOOK_URL`, `WISPR_API_KEY`.
Add a README with setup and run instructions.

### Acceptance Criteria
- [ ] `next dev` runs locally and serves an empty home page
- [ ] Tailwind config exposes `ink`, `paper`, `indigo`, and the three stamp colors as named tokens
- [ ] `.env.example` lists all four key names with no real values
- [ ] `netlify.toml` is configured for the Next.js runtime
- [ ] README documents install + run steps

### Technical Notes
Start with Next.js per PRD "Technical Constraints." Only switch to Vite +
React + TS + Tailwind if Netlify's Next adapter later blocks deploy (see
Issue 15) — do not build that fallback now.

### Out of Scope
Any screen, route, or API logic. Netlify deploy itself (Issue 15).

---

## 2. Locked content module — profile, questions, rubric

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 1

### Context
The start screen, call flow, translation, Scribe, and both grading paths all
need one shared, typed source for the student profile, the 3 locked
questions (with pitch-mode EN/MY by index), and the rubric — so nothing
drifts between n8n and `/api/grade`.

### Task
Create typed content modules: `lib/content/profile.ts`, `lib/content/questions.ts`
(Tanaka-sensei's questions), `lib/content/pitchAnswers.ts` (the student's
pitch-mode phone-clip answers — a distinct concern from the sensei
questions, keyed by question index), and `lib/content/rubric.ts`, all
imported by both `/api/grade` and, for the rubric, generated into a
paste-ready doc for the n8n workflow. Profile: Aung Min Khant's locked
fields (name, age, hometown, education, current job, study purpose,
post-graduation plan, language goal, study duration, sponsor), plus a
`DISPLAY_CARD_FIELDS` list naming exactly the 6 fields the start-screen
card shows. Questions: 3 entries in order, each with the sensei's Japanese
line, English translation, and Burmese translation (always shown in the
HUD). Pitch answers: 3 entries keyed by `questionIndex` (0/1/2) with the
locked Japanese phone-clip line plus its English and Burmese translation
(shown only on `?pitch=1`, after that question's answer). Rubric: six
categories, weights (Speaking 20, Listening 15, Grammar & politeness 15,
Motivation 20, Study plan 20, Consistency 10), formula `(score / 5) ×
weight`, the headline table (Ready/Almost Ready/Keep Practicing), and the
two gates (Speaking ≤ 2; Motivation ≤ 2 or Study plan ≤ 2) — exposed as
`getRubricPrompt()`, `parseRawScores()`, `scoreReport()`, and
`getRubricDoc()` (a generated, paste-into-n8n artifact combining the
prompt and an equivalent JS scoring snippet, snapshot-tested against
`docs/rubric-generated.md` so drift from the TS source fails a test).

### Acceptance Criteria
- [x] Profile object matches every locked field in `docs/prd-nihongo.md` / `context.md` exactly
- [x] `questions` array has exactly 3 entries, in order, each with `japanese`, `englishTranslation`, `burmeseTranslation`
- [x] `pitchAnswers` array has exactly 3 entries keyed by `questionIndex` (0/1/2), each with `japanese`, `english`, `burmese`, matching the locked phone-clip lines
- [x] Rubric module contains categories, weights, formula, headline table, and both gates as a single copy-from source (`getRubricDoc()`, snapshot-tested against `docs/rubric-generated.md`)
- [x] No occurrence of "N5", "JLPT", "A1", "Pass", or "Fail" anywhere in display-facing content

### Technical Notes
This module is imported by Issues 3 (profile card), 5 (question playback),
11 (grading), and 14 (pitch answers). Keep it framework-agnostic (plain
TS objects/JSON) so the rubric doc can be regenerated and pasted into the
n8n workflow node whenever it changes. `english`/`burmese` translation text
was authored for this build (the PRD locks only the Japanese) — have a
native Burmese speaker review it before event day.

### Out of Scope
Any UI. `mocks/sample-report-ready.json` (already exists, unchanged here).

---

## 3. Start screen — splash, profile card, Join, desktop-only gate

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 1, 2

### Context
This is the app's entry point and the pitch's first ~5 seconds: NihonGo
branding, the one locked profile, and a single Join action — no form, no
second student, no phone layout.

### Task
Build the home route: NihonGo header + subtitle "Japanese language school
interview practice," a read-only Aung Min Khant card sourced from the
Issue 2 content module (name, age, hometown, education, plan, sponsor),
and a "Join interview" button. Detect a narrow/phone viewport and render a
simple "Open on a computer" message instead of Join in that case.

### Acceptance Criteria
- [x] Home page shows "NihonGo" + subtitle; never prints N5, JLPT, A1, Pass, or Fail
- [x] Profile card renders name, age, hometown, education, plan, sponsor from the content module, read-only, no inputs
- [x] "Join interview" navigates to the call screen
- [x] On a narrow viewport, the interview UI and Join are replaced by an "Open on a computer" message
- [x] No sign-up, password, or email field anywhere on this screen

### Technical Notes
No live form-filling, no second sample student. This is a one-click path.

### Out of Scope
Call UI itself (Issue 4). Session persistence beyond the browser refresh lifetime.

---

## 4. Call UI shell — tiles, camera/mic toggles, dark theme

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 3

### Context
Before any question can play, the call screen needs its Zoom-like frame:
two tiles, toggles, and the locked dark visual signature, with camera
failure handled gracefully.

### Task
Build the call screen layout: student tile + Tanaka-sensei tile (static
illustration in `/public`, no live face generation, no lip-sync), camera
on/off toggle (default on), mic on/off toggle (default on), Ink background
with Indigo accents. If camera permission is denied/blocked, render a
"camera off" placeholder tile and still start the interview — never block
on the permission dialog. Sensei tile shows the label
`Tanaka-sensei · AI · Admissions` with "Tokyo Pathway Japanese School"
underneath.

### Acceptance Criteria
- [ ] Call screen renders both tiles side by side on an Ink background with Indigo accents
- [ ] Camera toggle defaults on; a denied/blocked permission shows a placeholder tile and the interview still starts
- [ ] Mic toggle defaults on
- [ ] Sensei tile shows the static image, the exact label, and the school name
- [ ] Camera state (on/off/blocked) never affects any score

### Technical Notes
Camera is presence-only. Scoring always comes from speech/text, never video.

### Out of Scope
Question playback, waveform animation, HUD captions, student input (later issues).

---

## 5. Question flow engine + ElevenLabs TTS with local fallback

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 4, 2

### Context
This is the spine of the interview: exactly 3 questions, one answer each,
spoken by Tanaka-sensei via ElevenLabs, with no spoken follow-ups and no
key exposed to the client.

### Task
Implement the sequential state machine: Q1 → answer → Q2 → answer → Q3 →
answer → done. On entering each question, play its locked Japanese line
via a server-side route that proxies ElevenLabs `/v1/text-to-speech/stream`
(key stays server-only). If the TTS call exceeds 1.5s latency, fall back to
a pre-rendered local `.mp3` in `/public` for that question while keeping the
same playback contract. On Join, fire a one-off ping/health request to the
n8n webhook URL to warm the workflow (fire-and-forget, no blocking).

### Acceptance Criteria
- [ ] Joining the call auto-plays Q1; each submitted answer advances to the next question in order, never repeating or skipping
- [ ] The ElevenLabs API key is only ever read server-side; the client never receives it
- [ ] Simulating TTS latency over 1.5s falls back to the local `.mp3` for that question and the flow still advances normally
- [ ] Join triggers a fire-and-forget request to the n8n webhook URL; its failure never blocks Join
- [ ] Exactly 3 questions total; no additional or repeated spoken prompts are ever triggered

### Technical Notes
Question text/order comes from Issue 2's content module. This issue owns
the "answer" transition trigger but not how the answer is captured
(Issue 7).

### Out of Scope
Grading, HUD captions, waveform visuals, actual student input capture.

---

## 6. Language HUD — Japanese captions, waveform switching

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 5

### Context
Without the huge-caption HUD and the speaker-switching waveform, the call
looks like a plain video widget instead of NihonGo's visual signature.

### Task
Add the HUD bar to the call screen: large Japanese captions. For
Tanaka-sensei, always show the pre-written Japanese line for the current
question while she is speaking (from the Issue 2 content). Add a waveform
indicator that switches between Indigo (student speaking) and Paper at
~60% opacity (sensei speaking) based on the current turn.

### Acceptance Criteria
- [ ] HUD shows large Japanese text matching the active question while sensei speaks
- [ ] Waveform is visually distinct between the sensei-speaking and student-speaking states
- [ ] No English or Burmese caption appears yet for sensei outside pitch mode
- [ ] No score or diagnostic text is shown anywhere on the call screen

### Technical Notes
Sensei subtitles are always pre-written, never generated live.

### Out of Scope
Student voice capture, `/api/translate`, pitch-mode EN/MY, sidebar transcript.

---

## 7. Student voice/type input — Wispr/browser fallback + Type instead

**Type:** Feature
**Size:** Large (4-8hrs)
**Depends on:** 6

### Context
This is the other half of the live interview: capturing what the student
actually says or types, on the same screen, without ever forcing a
follow-up question regardless of answer quality.

### Task
Capture the student's spoken answer via Wispr, or the browser Web Speech
API as a fallback using an identical request/response payload shape when
Wispr keys are missing, producing a live Japanese caption in the HUD while
speaking. Add a "Type instead" control that stays visible whenever mic is
on. If mic is off, or no transcript is produced, show an answer text box on
the same screen (no navigation). Submitting an answer (end-of-turn or
typed submit) advances the question flow from Issue 5. Record per-question
metadata: transcript text, input mode (`voice` | `typed`), and — for
spoken answers — a reference to the captured audio clip for Issue 9.

### Acceptance Criteria
- [ ] With mic on, speaking produces a live Japanese HUD caption from Wispr or the browser-speech fallback, using one shared payload shape
- [ ] "Type instead" is visible while mic is on and reveals the answer box without leaving the call screen
- [ ] If mic is off, the answer box is shown by default
- [ ] Submitting an answer (voice or typed) advances the question flow and stores transcript + inputMode + audio clip reference (spoken only)
- [ ] No spoken follow-up question is ever triggered, regardless of answer length or content

### Technical Notes
This issue only captures/stores the answer and advances the flow. Scoring
and Scribe happen in later issues.

### Out of Scope
Scribe background transcription (Issue 9), live English translation
(Issue 8), grading (Issue 11).

---

## 8. Live English translation for testers — `/api/translate`

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 7

### Context
Testers/judges who speak or type live Japanese should see an English line
under the caption, but this must never block the interview or leak keys.

### Task
Implement `POST /api/translate`: accepts
`{ japanese, context: "school interview answer" }`, calls Gemini 2.5 Flash
server-side, returns `{ english }`. Call it in the background right after
each non-pitch-mode student answer's Japanese transcript is finalized,
with a 3-second timeout. On timeout or error, fail open — hide the English
line, no crash, no retry.

### Acceptance Criteria
- [ ] `/api/translate` accepts the documented request shape and returns `{ english }` via Gemini 2.5 Flash, with the key read only server-side
- [ ] The call fires automatically after each non-pitch student answer's transcript is ready
- [ ] A response later than 3 seconds, or any error, results in no English line and no crash or progression block
- [ ] With `?pitch=1` present, `/api/translate` is never called

### Technical Notes
Separate from the n8n grading workflow. Background/best-effort only.

### Out of Scope
Pitch-mode EN/MY (Issue 14). Burmese translation (explicitly excluded from this build).

---

## 9. Background Scribe transcription per spoken answer

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 7

### Context
Pronunciation-aware Speaking scoring needs a Scribe transcript per spoken
answer, but it must never introduce waiting, spinners, or visible scores
during the live call.

### Task
After each spoken answer (using the Issue 7 audio clip reference), send
the clip to ElevenLabs Scribe in the background via a server route (key
server-side only). Never block, show a spinner, or reveal a score before
Q2/Q3. After Q3, wait for outstanding Scribe jobs up to a bounded time,
then finish-or-drop and proceed to grading (Issue 11) regardless. If a
clip's Scribe call fails, flag that answer to be scored from its
Wispr/browser transcript instead.

### Acceptance Criteria
- [ ] Each spoken answer triggers a background Scribe request immediately after submission, with no visible waiting state
- [ ] Typed answers never trigger a Scribe call
- [ ] After Q3, the flow proceeds after a bounded wait for in-flight Scribe jobs, never blocking indefinitely
- [ ] A failed Scribe call flags that answer to use its Wispr/browser transcript for scoring, without raising an error to the user

### Technical Notes
This issue only produces/attaches transcripts and fallback flags; it does
not compute any score itself.

### Out of Scope
Rubric/grading logic (Issue 11). Any scoring UI.

---

## 10. Sidebar — progress/status + live transcript

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 6

### Context
The student needs to see where they are in the interview and a running
transcript, without any score or diagnostic leaking before the report.

### Task
Add a sidebar to the call screen showing current progress (e.g. "Question
2 of 3"), current status (e.g. asking/listening), and a chronological live
transcript of sensei questions and student answers submitted so far.

### Acceptance Criteria
- [ ] Sidebar shows the active question number out of 3
- [ ] Sidebar transcript lists each turn (sensei question, student answer) in order as the interview progresses
- [ ] No score, rubric, or diagnostic content appears in the sidebar at any point during the interview

### Technical Notes
Purely presentational over state already produced by Issues 5–7.

### Out of Scope
Report screen, radar, stamp (Issues 13–14).

---

## 11. Grading — n8n webhook + `/api/grade` fallback + shared rubric

**Type:** Feature
**Size:** Large (4-8hrs)
**Depends on:** 2, 9

### Context
This is the scoring engine both the practice app and the pitch depend on.
Two independent paths (n8n, `/api/grade`) must agree on the exact same
rubric, weights, gates, and JSON shape.

### Task
After Q3 (and Scribe finish-or-drop from Issue 9), POST the full transcript
(per question: the text to score per the Scribe/Wispr fallback flag, input
mode, and profile data) to the pre-warmed n8n webhook, which runs Gemini
2.5 Flash inside the workflow using the Issue 2 rubric and returns JSON in
the same shape as `mocks/sample-report-ready.json`. Wait 5 seconds, no
retry. On timeout/failure, call `POST /api/grade` once, using the same
Gemini model, same rubric, same JSON shape. n8n must never call
`/api/grade`.

### Acceptance Criteria
- [ ] After Q3, the transcript payload is POSTed to the n8n webhook URL from env
- [ ] A valid n8n response within 5 seconds (matching the `sample-report-ready.json` shape) is used as the result
- [ ] A timeout or error from n8n triggers exactly one call to `/api/grade` (no n8n retry), producing a report in the identical JSON shape
- [ ] Six scores use weights 20/15/15/20/20/10 and formula `(score / 5) × weight`, matching the PRD table, in both paths
- [ ] Headline/gate logic (Ready/Almost Ready/Keep Practicing, including the Speaking ≤ 2 gate and Motivation ≤ 2 / Study plan ≤ 2 gate) is identical between the n8n workflow spec and `/api/grade`
- [ ] Typed answers score Speaking only on "answered the question + understandable です/ます," never on pronunciation

### Technical Notes
The rubric text lives once in Issue 2's module/doc and is pasted into the
n8n Gemini node and `/api/grade` — do not fork it.

### Out of Scope
Dual-failure sample fallback (Issue 12). Report rendering (Issue 13).

---

## 12. Dual-grade failure fallback — sample report + banner

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 11

### Context
The report screen must never go blank or spin forever, even if both
grading paths fail on the same run.

### Task
If both the n8n webhook and `/api/grade` fail (timeout or error) after the
5-second n8n window, use `mocks/sample-report-ready.json` as the report
result and show a small banner: "Scoring unavailable — sample report."

### Acceptance Criteria
- [ ] Simulating failure of both n8n and `/api/grade` renders the report screen using `mocks/sample-report-ready.json` data
- [ ] The banner "Scoring unavailable — sample report." is shown only in this failure case
- [ ] No blank screen or indefinite spinner is reachable in this path

### Technical Notes
The same JSON also backs the `?pitch=1` canned last-screen swap (Issue 14) — reuse, don't duplicate.

### Out of Scope
Pitch-mode-specific swap when a live (non-failed) score isn't Ready (Issue 14).

---

## 13. Practice report screen — animated radar, stamp, six scores, coaching

**Type:** Feature
**Size:** Large (4-8hrs)
**Depends on:** 11, 12

### Context
This is the payoff screen for both the practicing student and the judge:
"Interview Readiness," an animated radar of six scores, a large stamp, and
coaching — never exam labels.

### Task
Build the report screen shown once grading resolves: headline "Interview
Readiness" with the stamp (準備OK / もう少し / 要練習) in its locked color.
Animate the reveal in order: radar chart of the six scores animates in
first, then the stamp appears, then coaching notes render. If any answer
in the set was typed, include the coaching line "This answer was typed, so
pronunciation was not checked." for that question. When Speaking ≤ 2 fired
the gate but motivation/plan did not, coaching must state the life-plan
story is fine and the gap is Japanese ability, not the life plan.

### Acceptance Criteria
- [ ] Report shows "Interview Readiness" plus the correct stamp (準備OK/もう少し/要練習) in its locked color for the given headline
- [ ] Reveal order is strictly radar → stamp → coaching notes, never simultaneous
- [ ] All six category scores and the `/100` total are displayed
- [ ] Report never prints N5, JLPT, A1, Pass, or Fail anywhere
- [ ] Typed-answer disclaimer and Speaking-gap-vs-life-plan coaching wording appear when their conditions are met
- [ ] No score or report content is visible anywhere before Q3 completes

### Technical Notes
Radar library vs. custom SVG is not locked; the animated reveal sequence is
the requirement.

### Out of Scope
Pitch-mode last-screen swap (Issue 14).

---

## 14. Pitch mode (`?pitch=1`) — EN/MY by question index + canned last-screen swap

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 6, 13

### Context
The 18:00 pitch has no safety net: it must show pre-written captions (not
fuzzy-matched) and never show a weak live score to the room.

### Task
When the URL has `?pitch=1`: after each of Q1/Q2/Q3, always show the
pre-written English + Burmese caption for that question's index from the
Issue 2 content — never fuzzy-matched against the live transcript — and
skip `/api/translate` entirely. After grading, if the live headline is
Ready/準備OK, show the live report as normal; otherwise, swap only the last
screen to the canned report from `mocks/sample-report-ready.json`, with no
reload and no re-Join.

### Acceptance Criteria
- [ ] With `?pitch=1`, after each question's answer, the HUD shows the exact pre-written EN/MY line for that index regardless of what was actually said
- [ ] With `?pitch=1`, `/api/translate` is never called
- [ ] With `?pitch=1` and a live headline of Ready/準備OK, the live report is shown
- [ ] With `?pitch=1` and a live headline of Almost Ready or Keep Practicing, only the last screen is replaced with the canned sample report, with no reload or navigation
- [ ] Without `?pitch=1`, behavior is unchanged: live English via `/api/translate`, and the honest live report always shows

### Technical Notes
Question index alone determines the caption; do not attempt any transcript matching.

### Out of Scope
Anything not specific to pitch mode — all underlying flows come from prior issues.

---

## 15. Deploy to Netlify + env wiring

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 1

### Context
The practice app needs a real, shareable URL with keys kept off the
client, and a documented contingency if the Next.js adapter misbehaves.

### Task
Configure Netlify deployment using the Next.js runtime, wire the four
required environment variables (`ELEVENLABS_API_KEY`, `GEMINI_API_KEY`,
`N8N_WEBHOOK_URL`, `WISPR_API_KEY`) into Netlify site settings, and verify
no key name/value appears in the client bundle. Document the Vite + React
+ TS + Tailwind + Netlify Functions fallback in the README as a
contingency only.

### Acceptance Criteria
- [ ] Netlify deploy succeeds from `main` using the Next.js runtime
- [ ] All four env vars are set in Netlify and read only from server-side code
- [ ] A build/bundle check confirms no API key name or value ships to the client
- [ ] README documents the Vite fallback plan without implementing it
- [ ] The live Netlify URL serves the start screen correctly

### Technical Notes
Only implement the Vite fallback if the Next.js adapter actually blocks deploy — not preemptively.

### Out of Scope
Any feature work; this issue is deploy/config only.

---

## Build order summary

1 → 2 → 3 → 4 → 5 → 6 → 7 → {8, 9, 10 in parallel} → 11 → 12 → 13 → 14, with **15** deployable any time after 1 and re-checked after each API-route issue (5, 8, 9, 11).
