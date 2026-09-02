# PRD — Pushback, quoted critique, and usefulness survey
**Status:** Draft
**Date:** 2026-09-02
**Built by:** Kyaw Naing Lin

---

## Problem
A prospective Japanese language-school applicant (often in Myanmar, without a human coach) can finish NihonGo’s 3-question Interview with freeze, mumble, or broken-Japanese input scored as if it were a real answer. The Interview Readiness report can then show unconstrained coaching that is only praise, with no quoted phrase to change. There is no post-report step that records whether that feedback felt useful or easy to use, so the CSC 485 research question cannot be answered from the product itself.

## Goal
A first-time applicant can be asked to try the same Question again when the transcript is empty, too short, or has no Japanese kana; then see one quoted critique per Question (phrase they said, English reason, Japanese rewrite); then optionally rate usefulness and usability, with that rating leaving the browser as research evidence.

## Users
Prospective Japanese language-school applicants and faculty testers on the live Interview (same pushback, critique, and survey). Not a logged-in account holder. `?pitch=1` is the CSC 492 demo path: same pushback and critique, **no** survey.

## Requirements

### Must Have
- **Scope of this change:** in-the-moment pushback, per-Question quoted critique on the report, and the skippable usefulness/usability step. Same-Question re-answer is a capped clarification, not retry/history across Interviews.
- **Stay on the Question.** Pushback does not advance `useQuestionFlow`. The stored, scored answer is the attempt that passes the check, or attempt 3 if the cap is hit.
- **Cap:** two pushbacks, three attempts per Question, then force forward. Attempt 3 is stored and scored even if it still fails the check.
- **Empty Speak Submit** still opens Type (today’s freeze path) **and counts as attempt 1**. Nothing is stored until a passing attempt or attempt 3.
- **Pushback triggers only** what this PRD labels freeze / mumble / broken Japanese. That label is a **cheap proxy heuristic**, not grammar analysis: after trim, for Speak and Type alike, fail if empty / whitespace-only, or shorter than 2 characters, or **no Hiragana and no Katakana**. Real grammar, politeness, relevance, and plan quality are **not** decided here; they surface later in RawScores and quoted critique.
  - **Kanji-only fails** because Kanji overlaps Chinese Hanzi, so it cannot be trusted as a Japanese signal. Mixed English + kana can pass. `はい` passes.
  - Vague, off-topic, and contradiction are **not** pushback (those stay in Relevance / Consistency RawScores after Q3).
- **Detection is local and free.** No paid API during the student turn to decide pushback. No TTS for the try-again line. Scribe runs only on the stored attempt. Sidebar lists only the stored attempt. No “2 of 3” attempt counter.
- **Try-again UI:** Question Japanese stays in the HUD; one locked line underneath (all three triggers share it). Hide the line on the first Type keystroke or the first live Speak caption character; show it again only if that attempt fails.
  - JA: `すみません、もう一度お願いします。`
  - EN: `Sorry, could you try answering that again?`
  - MY (draft): `တစ်ဖန်ထပ်ဖြေပေးပါဦးနော်။`
- Each **answer object in the `POST /api/score` request body** includes stored `transcript`, `inputMode`, `questionIndex`, plus `pushbackCount` (`0`–`2`) and `forced` (attempt 3 still failed the check). These fields are inputs to grading/critique, not fields the score response invents.
- **Headline, Stamp, gates, weights, six RawScores, radar, and total** stay unchanged. Critique is added under them, not a replacement for scores.
- **Critique replaces** the old 2–4 freeform coaching notes. Critique appears **only** on the Interview Readiness report after Q3 (never during Q1–Q3).
- **Every Question gets exactly one critique** with: exact-substring `quote`, English `explanation` (grader model), Japanese `rewrite`, exactly one `RubricCategoryKey`.
- **Quote rules:** must be an exact substring of that Question’s stored transcript, except `（無言）` which is legal **only** when the transcript is empty after trim. Non-empty forced garbage must quote a real substring, never the placeholder.
- **Rewrite:** Japanese only. For a strong answer, `rewrite` may equal `quote` (affirming). If `forced` is true, `rewrite` must **not** equal `quote` and must contain at least one Hiragana or Katakana; empty/`（無言）` still needs a real Japanese suggestion, never the placeholder.
- **Burmese on the report is locked templates**, not model-generated prose. App fills `{quote}`, `{rewrite}`, and `{explanation_my}` from `RubricCategoryKey`. Two frames. **Authoritative punctuation is the Myanmar section sign `။` (and Myanmar comma `၊` in the affirming frame), not the Japanese full stop `。`.** Early grill-me / spec drafts used `。` inside Burmese; this PRD corrects that on purpose so it matches the consent copy and actual Burmese orthography. Native review treats **this PRD’s strings** as the source, not the `。` drafts.
  - Corrective (`rewrite` ≠ `quote`): `သင်ပြောခဲ့သည့်စာကြောင်း − 「{quote}」။ {explanation_my}။ ဒီအစား − 「{rewrite}」 ဟုပြောနိုင်ပါသည်။`
  - Affirming (`rewrite` = `quote`): `သင်ပြောခဲ့သည့်စာကြောင်း − 「{quote}」။ {explanation_my}၊ ကောင်းစွာပြောနိုင်ခဲ့ပါသည်။`
- **Corrective `{explanation_my}` (draft):**
  - `speaking`: `အသံထွက်နှင့် စကားစီးဆင်းမှုကို ပိုမိုကောင်းမွန်အောင် ပြုလုပ်ရန်`
  - `listening`: `မေးခွန်းနှင့် ပိုမိုကိုက်ညီအောင် အဖြေပေးရန်`
  - `grammarPoliteness`: `ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှုကို ပိုမိုတိကျအောင် ပြုလုပ်ရန်`
  - `motivation`: `လိုချင်သည့်ရည်ရွယ်ချက်ကို ပိုမိုရှင်းလင်းအောင် ဖော်ပြရန်`
  - `studyPlan`: `လေ့လာမည့်အစီအစဉ်ကို ပိုမိုရှင်းလင်းအောင် ဖော်ပြရန်`
  - `consistency`: `ယခင်အဖြေများနှင့် ပိုမိုကိုက်ညီအောင် ပြုလုပ်ရန်`
- **Affirming `{explanation_my}` (draft):**
  - `speaking`: `အသံထွက်နှင့် စကားစီးဆင်းမှု ချောမွေ့ပြီး`
  - `listening`: `မေးခွန်းနှင့် ကိုက်ညီသော အဖြေပေးနိုင်ပြီး`
  - `grammarPoliteness`: `ဂျပန်သဒ္ဒါနှင့် ယဉ်ကျေးသုံးနှုန်းမှု တိကျပြီး`
  - `motivation`: `ရည်ရွယ်ချက်ကို ရှင်းလင်းစွာ ဖော်ပြနိုင်ပြီး`
  - `studyPlan`: `လေ့လာမည့်အစီအစဉ်ကို ရှင်းလင်းစွာ ဖော်ပြနိုင်ပြီး`
  - `consistency`: `ယခင်အဖြေများနှင့် ကိုက်ညီစွာ ပြောနိုင်ပြီး`
- **Schema:** `category` must be present and one of the six `RubricCategoryKey` values. Do **not** runtime-check whether English text “matches” that category (no second LLM). Invalid quote / missing critiques / bad category / `forced` with `rewrite === quote` / empty transcript without `（無言）` → that grader is a **miss**.
- **n8n then Groq unchanged as the path.** Old n8n JSON (scores + old coaching, no valid quoted critiques) is a **miss**, then `runGroqGrade`. Sample report only if **both** fail schema. `getRubricPrompt()` / `getRubricDoc()` / `docs/rubric-generated.md` must ask for the new critique shape so n8n and Groq cannot diverge.
- **Canned sample** (`getSampleReport` / `mocks/sample-report-ready.json`) must include valid per-Question quoted critiques so dual-fail does not look like a blank coaching section.
- **Pitch (`?pitch=1`):** pushback and critique still run; **survey does not**. Always show the **live** InterviewReport. Retire Headline-based last-screen swap in `selectDisplayedReport`. Sample remains only for dual-grade failure (banner kept).
- **Usefulness step** (not Pitch): after radar / stamp / critique reveal finishes. Two 1–5 ratings (usefulness of feedback, usability of the session) **both required to Submit**; optional comment; **Skip** allowed and must POST as skipped (not silent). New dedicated Google Form (not the tester-count form). Session id on the report (small tag) and in the POST. Also POST Headline, total, source collapsed to **live** vs **sample** (not `n8n` vs `grade`), and **per-Question `pushbackCount` and `forced`** for Q1–Q3 so a rating can be correlated with whether that student was pushed back or forced through.
- **Survey copy (draft, EN + MY):**
  - Consent EN: `Your ratings help a CSC 485 research study on AI interview feedback. Answers are anonymous and optional.`
  - Consent MY: `သင့်အဆင့်သတ်မှတ်ချက်များသည် CSC 485 သုတေသနလေ့လာမှုအတွက် အသုံးပြုပါမည်။ အမည်မဖော်ပြပါ၊ ဖြေရန်မလိုအပ်ပါ။`
  - Usefulness EN: `How useful was this feedback for improving your interview answers?` — 1 = Not useful at all, 5 = Extremely useful.
  - Usefulness MY: `ဒီအကြံပြုချက်သည် သင့်အင်တာဗျူးအဖြေများ တိုးတက်ရန် မည်မျှအသုံးဝင်ပါသလဲ။` — 1 = လုံးဝအသုံးမဝင်ပါ, 5 = အလွန်အသုံးဝင်ပါသည်။
  - Usability EN: `How easy was this practice session to use?` — 1 = Very difficult, 5 = Very easy.
  - Usability MY: `ဒီလေ့ကျင့်ခန်းစက်ရှင်ကို အသုံးပြုရလွယ်ကူပါသလဲ။` — 1 = အလွန်ခက်ခဲသည်, 5 = အလွန်လွယ်ကူသည်။
  - Skip EN: `Skip` — Skip MY: `ကျော်မည်`
- **Ship vs testers:** the app may merge with the survey **hidden** if the form URL is missing. Faculty testers and real applicants must not run until: form URL wired, n8n prompt Published, native Burmese review of all MY drafts, and an **explicit instructor answer on RSU / CSC 485 consent** (see Open Questions).

### Should Have
- Keep `InterviewReport.source` (`n8n` | `grade` | `sample`) in the client for debugging; do not send n8n vs Groq to the research form.
- After native Burmese review, replace draft MY strings in one place (content module) without changing behavior.

### Must NOT Have (explicit exclusions)
- Start-screen / lobby / “Join interview” admission-wording copy in this change.
- Renaming rubric `listening` to Relevance in this change.
- Retry of the same Question after the Interview is done, attempt history, or a fluency trend chart.
- Database, accounts, or storing answers in `localStorage` / `sessionStorage` as research evidence.
- Spoken follow-up Questions, mid-call scoring, or LLM judgment of vague / off-topic / contradictory answers during the turn.
- TTS / spoken Tanaka-sensei pushback.
- Extra paid API calls during the student turn (detection or a second “grade the grader” call).
- Scribe or sidebar entries for failed attempts 1–2.
- Keeping the old 2–4 coaching notes alongside the new critiques.
- Pitch-mode Headline last-screen swap to the canned Ready sample.
- Showing the usefulness step on `?pitch=1`.
- Replacing n8n / changing the grader stack in this change.
- Requiring a survey response (Skip must remain).
- Submitting the survey with a blank usefulness or usability rating.

## Phasing
Build and merge in three checkpoints so each is a working demo, not one all-or-nothing PR:

1. **Pushback cap** — local transcript check, attempt counter, try-again line, empty-Speak → Type counts, Scribe/sidebar only on stored attempt. Scoring payload may already send `pushbackCount` / `forced`; graders may ignore them until phase 2.
2. **Critique schema + grader sync** — replace coaching notes; quote / rewrite / category rules; `getRubricPrompt` + n8n + Groq + sample JSON; retire Pitch Headline swap. Phase 1 behavior stays.
3. **Survey + session id** — reveal-gated usefulness step, optional form URL, Skip/Submit POST including per-Question pushback fields. Phase 1–2 stay. Testers still wait on form URL, n8n Publish, native MY review, and the consent/IRB answer.

## Technical Constraints
- Existing stack: Next.js App Router, Vitest, thin `/api/score` over `gradeInterview` (n8n then `runGroqGrade` then `getSampleReport`). `lib/content/rubric.ts` remains the only copy of weights, gates, and Headline math — this change must not retune them.
- `lib/server/` stays server-only. Survey POST may use a new optional env URL; missing URL hides the step and must not fail `npm run build` the way a required TTS/Scribe key does.
- No new paid provider for pushback. Existing post-Q3 Groq/n8n spend is unchanged in count (one grade per Interview).
- Ask before any live `.env.local` hit to n8n or Groq. Unit tests mock `fetch`.
- Domain terms stay as in `docs/ubiquitous-language.md` (Interview, Question, RawScores, InterviewReport, Headline, Stamp, InputMode, Pitch mode). Pushback is same-Question clarification, not a fourth Question.

## Open Questions
- **CSC 485 / RSU consent (blocker before testers, not a merge blocker):** does the instructor require a lightweight IRB or extra consent form beyond the in-app one-line disclosure already locked here? Unresolved on the parent NihonGo risk notes; this PRD now ships a live ratings form, so it needs an explicit yes/no before any faculty tester or applicant session.
- Exact Google Form URL, env var name, and POST field entry IDs (form does not exist yet).
- Session id format (e.g. UUID vs short token) — only “random, shown on report, sent with the POST” is locked.
- Exact visual placement of the session tag and try-again line (HUD vs answer dock) beyond “Question stays, line underneath, small unobtrusive tag.”
- Native Burmese review may change all MY drafts (try-again, templates, survey, both `{explanation_my}` sets) before testers run; English/JA locks stay unless review finds a JA issue. Reviewer uses **this PRD’s `။` / `၊` templates**, not older `。` drafts.
- n8n Code node may need a pass-through so critique objects are not stripped; confirm when re-pasting RubricDoc (Issue 18 class work, tester blocker).

## Success Criteria
- Empty Speak Submit increments the attempt cap, opens Type, stores no answer; a third failed attempt stores and advances.
- A transcript with no Hiragana/Katakana does not advance until pass or attempt 3; `はい` advances as a stored answer without pushback.
- Failed attempts 1–2 never appear in the sidebar and never call `/api/scribe`.
- Report after Q3 lists six scores plus one quoted critique per Question; old unstructured coaching-only reports are rejected as a grader miss.
- `rewrite === quote` renders the affirming MY template; `forced` with `rewrite === quote` is a miss.
- `?pitch=1` never shows the survey and never swaps a non-Ready live report for the canned sample.
- Skip POSTs skipped; Submit without both 1–5 ratings is impossible; with form URL missing, the survey is hidden and the rest of the report still works.
- Survey POST (Submit or Skip) includes session id, Headline, total, live vs sample, and per-Question `pushbackCount` / `forced`.
- `npm test` covers the pushback cap, quote/substring/`（無言）` rules, critique-for-coaching replacement, Pitch survey skip, and retired Headline swap.

## Dependencies
- `useQuestionFlow`, `useAnswerCapture`, call page answer dock / HUD, `useBackgroundScribe`, `InterviewSidebar`.
- `getRubricPrompt` / `parseRawScores` (or a sibling parser for critiques) / `runGroqGrade` / `gradeInterview` / `docs/rubric-generated.md`.
- `buildReportView`, `InterviewReportScreen`, `selectDisplayedReport`, `mocks/sample-report-ready.json`.
- Manual: Publish n8n with the new RubricDoc, create the research Google Form, native Burmese review, and instructor yes/no on RSU/CSC 485 consent — tester blockers, not merge blockers for hiding the survey.
