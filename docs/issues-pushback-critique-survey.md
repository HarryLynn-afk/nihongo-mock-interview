# Issues — Pushback, quoted critique, and usefulness survey (from docs/prd-pushback-critique-survey.md)

Vertical slices in the PRD’s three phases. Same-Question **Pushback** is a capped clarification, not retry/history. Use terms from `docs/ubiquitous-language.md` plus the new terms this PRD introduces (**Pushback**, quoted **critique**, **Usefulness step**).

Issue **21** is Speak restore (`docs/issues-speak-restore-choice.md`). This list starts at **22**.

For each issue: `/build-plan` before starting, `/tdd` while building, `/after-task` when done.

Do not spend `.env.local` keys (n8n, Groq) while coding; mock `fetch`. Ask before any live grade POST.

---

## Phase 1 — Pushback cap

## 22. Gate Submit with the Pushback heuristic and a three-attempt cap

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 19, 21

### Context
A freeze, mumble, or non-kana transcript currently stores and advances (`docs/prd-pushback-critique-survey.md` Phase 1). The Interview must stay on the same **Question** until the transcript passes a cheap local check, or until attempt 3 is forced through.

### Task
Add a pure helper (e.g. `transcriptPassesPushbackCheck`) used by Speak and Type: after trim, fail if empty, shorter than 2 characters, or no Hiragana and no Katakana (Kanji-only fails; `はい` passes). Count attempts per Question: empty Speak **Submit** still opens Type and is attempt 1 (nothing stored). Do not call `submitAnswer` until the transcript passes, or this is attempt 3 (`forced`). Attempt 3 stores even if it still fails. Expose `pushbackVisible`, `pushbackCount` (`0`–`2`), and `forced` for later issues. Reset the attempt counter when the student turn for that Question ends (next **Question**). Update `docs/ubiquitous-language.md`: **Pushback** is same-Question clarification (cap 3), not a fourth Question and not retry/history.

### Acceptance Criteria
- [x] `はい` is a pass; whitespace-only, `"a"`, Kanji-only `你好`, and English-only fail
- [x] Empty Speak Submit opens Type, increments the attempt cap, does not call `onSubmit`
- [x] A failing Type/Speak Submit does not advance the **Question**
- [x] The third failing Submit calls `onSubmit` with that transcript (may be `""`) and `forced: true`
- [x] A passing Submit on attempt 1 or 2 stores that transcript, `forced: false`, and the matching `pushbackCount`
- [x] Speak and Type share the same check
- [x] No attempt counter (“2 of 3”) is shown
- [x] `npm test` covers the helper and the capture cap

### Technical Notes
- Likely `app/call/useAnswerCapture.ts` (only `onSubmit` when pass or attempt 3) so `useQuestionFlow` still stores one **StoredAnswer** per **Question**.
- Attach `pushbackCount` and `forced` on the stored **AnswerSubmission** / **StoredAnswer**.
- Ubiquitous language: **Question**, **Interview**, **InputMode**, **Pushback**. Heuristic is not grammar analysis.

### Out of Scope
Try-again HUD copy (Issue 23). Scribe/sidebar filtering (Issue 24). Quoted **critique**. Usefulness step. TTS. LLM mid-turn. Vague/off-topic/contradiction checks. Changing Headline/Stamp/weights.

---

## 23. Show the locked try-again line under the Question

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 22

### Context
Pushback with no visible nudge feels like a broken Submit (`docs/prd-pushback-critique-survey.md` try-again UI). Tanaka-sensei stays in Japanese; EN/MY are the short caption lines.

### Task
When `pushbackVisible`, keep the current **Question** Japanese in the Language HUD and render the locked try-again line underneath (HUD and/or answer dock; Question stays). One line for all triggers:
- JA: `すみません、もう一度お願いします。`
- EN: `Sorry, could you try answering that again?`
- MY (draft): `တစ်ဖန်ထပ်ဖြေပေးပါဦးနော်။`
Hide the line on the first Type keystroke or the first live Speak caption character. Show it again only if that attempt fails Pushback. No TTS.

### Acceptance Criteria
- [x] On Pushback, the **Question** Japanese is still visible
- [x] The three locked strings appear under it
- [x] First Type keystroke hides the line
- [x] First non-empty live Speak caption character hides the line (not merely clicking Speak)
- [x] A later failing Submit shows the line again
- [x] Passing or forced attempt 3 advances without leaving the line on the next **Question**

### Technical Notes
- `LanguageHud` and/or `app/call/page.tsx`. Put locked copy in `lib/content/` (not a server module).
- Tests: HUD/page. Ubiquitous language: **Question**, **Turn**, **Pushback**. MY uses `။` as in the PRD.

### Out of Scope
Scribe. Scoring. Critique. Survey. Pitch captions (`getPitchCaptions`). Admission-wording on `/`. Native Burmese review (Issue 29).

---

## 24. Persist only the stored attempt: sidebar, Scribe, and the score request body

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 22

### Context
Failed attempts 1–2 are not answers. Scribe on those clips would spend `ELEVENLABS_SCRIBE_API_KEY`. The grader later needs `pushbackCount` and `forced` on each stored row (`docs/prd-pushback-critique-survey.md`).

### Task
Keep sidebar transcript and `useBackgroundScribe` on `answers` from `useQuestionFlow` only (failed Pushback never reaches `submitAnswer` if Issue 22 is correct — verify and add tests). Each **answer object in the `POST /api/score` request body** includes `transcript`, `inputMode`, `questionIndex`, `pushbackCount` (`0`–`2`), and `forced`. `parseAnswers` must accept those fields (graders may ignore critique rules until Issue 25).

### Acceptance Criteria
- [x] Sidebar never lists a rejected attempt 1 or 2
- [x] `/api/scribe` is not called for a failing Speak attempt 1 or 2
- [x] Stored voice attempt (pass or forced 3) still Scribes as today
- [x] Score POST body answers include `pushbackCount` and `forced`
- [x] `parseAnswers` rejects missing/invalid `pushbackCount` or `forced`
- [x] No live Scribe/n8n/Groq in tests

### Technical Notes
- `useBackgroundScribe.ts`, `useInterviewScore.ts`, `app/api/grade/parseAnswers.ts`, `app/call/page.test.tsx`, score route tests.
- Ubiquitous language: **InputMode**, **InterviewReport** path unchanged. **Pushback** fields are request-body inputs, not score-response fields.

### Out of Scope
Changing `getRubricPrompt` or coaching (Issue 25). Usefulness POST. TTS. Database.

---

## Phase 2 — Critique schema and grader sync

## 25. Replace coaching notes with validated per-Question quoted critiques

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 24

### Context
Freeform 2–4 coaching notes can be praise-only. The research path needs one quoted **critique** per **Question**, and old n8n JSON must not win (`docs/prd-pushback-critique-survey.md` Phase 2).

### Task
Change `getRubricPrompt()` so the LLM returns **RawScores** plus exactly three critiques (`questionIndex`, exact-substring `quote`, English `explanation`, Japanese `rewrite`, one `RubricCategoryKey`). Do not retune weights/Gates/Headline. Parse/validate: quote is a substring of that answer’s transcript, except `（無言）` only when transcript is empty after trim; if `forced`, `rewrite !== quote` and rewrite has Hiragana or Katakana; empty transcript cannot use a non-placeholder quote. Invalid or old coaching-only n8n JSON is a **miss** → `runGroqGrade`. Sample only if both fail. Update `InterviewReport` to carry critiques instead of coaching strings. Update `mocks/sample-report-ready.json` / `getSampleReport` with three valid quoted critiques. Regenerate `docs/rubric-generated.md` (`rubricDoc.test.ts`).

### Acceptance Criteria
- [ ] `getRubricPrompt()` asks for quoted critiques (quote, explanation, rewrite, category), not unconstrained 2–4 coaching notes
- [ ] Old `{ scores, coaching }` n8n payload is a miss; Groq runs
- [ ] Fabricated quote (not a substring, and not legal `（無言）`) is a miss
- [ ] `forced` + `rewrite === quote` is a miss
- [ ] Dual-fail sample includes three quoted critiques (not an empty coaching list)
- [ ] `scoreReport` weights/Gates/Headline unchanged
- [ ] RubricDoc snapshot matches `docs/rubric-generated.md`
- [ ] Tests mock `fetch`; no live n8n/Groq

### Technical Notes
- `lib/content/rubric.ts`, new parse helper beside `parseRawScores`, `runGroqGrade.ts`, `gradeInterview.ts`, `sampleReport.ts`, `docs/rubric-generated.md`.
- n8n Code node must still run `scoreReport` on scores; critiques pass through on the **InterviewReport** (confirm when Issue 29 re-pastes).
- Ubiquitous language: **RawScores**, **RubricDoc**, **InterviewReport**, **RubricCategoryKey**. Do not runtime-check English vs category.

### Out of Scope
Report UI templates (Issue 26). Pitch last-screen swap (Issue 27). Usefulness step. Publishing n8n (Issue 29). Replacing n8n. Extra LLM “grade the grader” call.

---

## 26. Render quoted critiques on the Interview Readiness report

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 25

### Context
Critique is report-only, under the six **RawScores**, radar, total, **Headline**, and **Stamp** (`docs/prd-pushback-critique-survey.md`). Burmese is locked templates with `။` / `၊`, not model MY.

### Task
`buildReportView` / `InterviewReportScreen`: drop the old coaching list. Show one critique per **Question**: Japanese `quote`, English `explanation`, Japanese `rewrite`, and the MY frame. Corrective (`rewrite !== quote`): PRD corrective template. Affirming (`rewrite === quote`): affirming template + affirming `{explanation_my}`. Map `RubricCategoryKey` to the PRD’s two MY phrase sets (drafts). Keep typed-answer pronunciation line if still required by existing tests; do not keep the old 2–4 coaching notes. Copy lives in `lib/content/`.

### Acceptance Criteria
- [ ] Report still shows six scores, radar, total, **Stamp**
- [ ] Three critiques render; old freeform coaching array is not shown
- [ ] Affirming MY uses the “you said it well” frame, not “instead”
- [ ] Corrective MY uses the “instead / rewrite” frame
- [ ] MY punctuation is `။` / `၊` as in the PRD
- [ ] Critiques do not appear during Q1–Q3

### Technical Notes
- `app/call/buildReportView.ts`, `InterviewReportScreen.tsx`, tests. Typed-line in `buildReportView` may stay.
- Ubiquitous language: **InterviewReport**, **Headline**, **Stamp**, **RubricCategoryKey**, **Question**.

### Out of Scope
Session id and Usefulness step (Issue 28). `selectDisplayedReport` (Issue 27). Native MY review (Issue 29). Renaming `listening` to Relevance.

---

## 27. Always show the live InterviewReport in Pitch mode

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 25

### Context
Headline-based swap to the canned sample would show quotes the student never said (`docs/prd-pushback-critique-survey.md` Must NOT). Sample stays only for dual-grade failure.

### Task
Retire Headline-based last-screen swap in `selectDisplayedReport`: **Pitch mode** displays the live **InterviewReport** even when **Headline** is not `Ready`. Dual-fail `source: "sample"` + banner still uses `getSampleReport`. Update tests that expected a canned Ready swap.

### Acceptance Criteria
- [ ] `?pitch=1` + live AlmostReady/KeepPracticing shows that live report (not canned Ready)
- [ ] `?pitch=1` + live Ready still shows the live report
- [ ] Dual-fail sample + scoring-unavailable banner still shows
- [ ] Non-pitch testers still see the live report (unchanged)

### Technical Notes
- `app/call/selectDisplayedReport.ts` and `.test.ts`; call page wiring if any.
- Ubiquitous language: **Pitch mode**, **InterviewReport**, **Headline**. Update Pitch mode’s UL line if it still says last-screen swap for non-Ready.

### Out of Scope
Usefulness step on Pitch (must stay off — Issue 28). Changing `getPitchCaptions`. Replacing n8n.

---

## Phase 3 — Usefulness step and session id

## 28. Add the skippable Usefulness step after the report reveal

**Type:** Feature
**Size:** Medium (2-4hrs)
**Depends on:** 24, 26

### Context
Without a post-report rating, the CSC 485 question has no in-product evidence (`docs/prd-pushback-critique-survey.md` Phase 3). Pitch must not contaminate that dataset.

### Task
After radar/stamp/critique reveal finishes, show the **Usefulness step** (not during Q1–Q3): locked consent + usefulness + usability copy (EN+MY from the PRD), two 1–5 ratings both required to Submit, optional comment, Skip. Generate a random session id; show a small tag on the **Interview Readiness** report; include it in every POST. POST (Submit or Skip) must leave the browser: session id, **Headline**, total, source collapsed to `live` | `sample` (not `n8n` vs `grade`), per-**Question** `pushbackCount` and `forced`, ratings/comment or `skipped`. Optional env URL: missing URL **hides** the step and must not fail `scripts/check-env.mjs` / `npm run build`. `?pitch=1` never shows the step. Keep `InterviewReport.source` in the client for debug; do not send n8n vs Groq on the form.

### Acceptance Criteria
- [ ] Step appears only after the report reveal, never on `?pitch=1`
- [ ] Submit disabled until both ratings are 1–5
- [ ] Skip POSTs `skipped` (not silence)
- [ ] Submit POST includes session id, Headline, total, live/sample, Q1–Q3 `pushbackCount`/`forced`
- [ ] Session id is visible on the report
- [ ] Missing form URL: no step, report still works, `npm run build` env check still passes without that URL
- [ ] Tests mock the POST; no live Google Form in CI

### Technical Notes
- New content module for survey copy; optional env getter that does **not** use `requireEnv` (unlike TTS/Scribe). Client POST vs thin route: do not put the form URL in a server-only module imported by `"use client"` if that leaks; follow existing env isolation.
- Open Questions remain: exact env var name, Google Form entry IDs, session-id format (UUID vs short token — pick one in `/build-plan` and stick to it).
- Ubiquitous language: **InterviewReport**, **Headline**, **Pitch mode**, **Usefulness step**.

### Out of Scope
Creating the Google Form or wiring a production URL (Issue 29). Instructor IRB decision (Issue 29). Database. Required (non-skippable) survey. Showing n8n vs Groq on the form.

---

## 29. Unblock testers: RubricDoc in n8n, research form, Burmese review, consent answer

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 25, 28

### Context
Code can merge with the survey hidden. Faculty testers and real applicants must not run until ops and CSC 485 consent are done (`docs/prd-pushback-critique-survey.md` Ship vs testers / Open Questions).

### Task
(1) Paste current `docs/rubric-generated.md` into published n8n **NihonGo grade** (Define below, not `chatInput`); keep Code `scoreReport`; ensure critique objects are not stripped; Publish. Do not point n8n at `/api/grade`. (2) Create the dedicated research Google Form (not the tester-count form); put the URL in env; map POST fields from Issue 28. (3) Native Burmese review of PRD MY drafts (`။` / `၊` templates, not old `。`); replace strings in the content module only. (4) Get an explicit instructor yes/no on RSU / CSC 485 consent beyond the in-app one-liner. Ask before any live n8n/Groq POST.

### Acceptance Criteria
- [ ] n8n Published prompt matches current RubricDoc (quoted critiques + consistency = three answers)
- [ ] n8n still does not call `/api/grade`
- [ ] Research form URL is set; a Skip and a Submit land as separate rows with session id
- [ ] Native reviewer signed off (or tracked edits) on all MY drafts in the PRD
- [ ] Instructor consent/IRB question has a written yes/no before the first tester session
- [ ] `npm test` still passes without live keys

### Technical Notes
- This is ops + copy, not a scoring-math change. Issue **18** may already have been done for Direct Join; this paste is the **new** critique prompt.
- Ubiquitous language: **RubricDoc**, **InterviewReport**, **Usefulness step**.

### Out of Scope
Netlify Issue 15. Replacing n8n. Changing weights/Gates. Retry/history. Start-screen wording. Renaming Listening.

---

## Build order

22 → 23 and 24 (after 22, in either order) → 25 → 26 and 27 (after 25, in either order) → 28 → 29.

Phase 1 demo after 22–24. Phase 2 demo after 25–27. Phase 3 after 28 (survey hidden until 29).

## Explicitly not issues (PRD Must NOT)

- Admission-interview wording on `/` or lobby
- Renaming `listening` to Relevance
- Retry / attempt history / fluency trend
- Database, accounts, localStorage as evidence
- Spoken follow-ups, mid-call scoring, TTS Pushback
- Extra paid call during the student turn
- Replacing the n8n grader stack
- Pitch Usefulness step
- Keeping old coaching notes beside critiques
