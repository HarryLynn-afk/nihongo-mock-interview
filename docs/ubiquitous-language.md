# Ubiquitous Language — NihonGo

> This file is the single source of truth for domain terminology.
> Both the developer and Claude use these terms identically.
> Update this file whenever a new concept is introduced.
> Pass this file to Claude at the start of every session.
>
> Generated in Mode B (existing codebase) after Issues 1-2 were built —
> terms reflect what's actually in `docs/prd-nihongo.md`, `context.md`,
> and `lib/content/`, `lib/server/`, not fresh assumptions.

## Core Domain Terms

| Term | Definition | What it is NOT | Used in code as |
|------|------------|----------------|-----------------|
| Interview | The full 3-question session: Q1 → answer → Q2 → answer → Q3 → answer → report. | Not a test/exam; never scored or gated on N5/JLPT/A1 terms. | Not yet typed as one object — will be the state machine built in Issue 5. |
| Question | One of Tanaka-sensei's 3 locked Japanese prompts, always shown with its English + Burmese translation in the HUD. | Not the student's answer; not the pitch-mode caption shown after an answer (see `PitchAnswer`). | `InterviewQuestion`, `questions` in `lib/content/questions.ts` |
| PitchAnswer | Aung Min Khant's locked phone-clip answer for the 18:00 pitch, keyed by question index, with its own English + Burmese translation. | Not a live/typed answer from a real tester; not the sensei's question. | `PitchAnswer`, `pitchAnswers` in `lib/content/pitchAnswers.ts` |
| Profile | Aung Min Khant's locked biographical + plan data (read-only, no live form). | Not a user account; not editable; not persisted anywhere. | `StudentProfile`, `profile` in `lib/content/profile.ts` |
| Display card fields | The exact 6 `Profile` fields (`name`, `age`, `hometown`, `education`, `plan`, `sponsor`) the start-screen card is allowed to show. | Not all of `Profile` — fields like `internalLanguageGoal` exist for scoring/consistency but are never rendered. | `DISPLAY_CARD_FIELDS` in `lib/content/profile.ts` |
| RawScores | The six 1–5 integer category scores as emitted by an LLM grading pass, before weighting. | Not the final report; not yet validated against malformed LLM output. | `RawScores` type in `lib/content/rubric.ts` |
| ScoredReport | The fully computed result: weighted points per category, total, fired gates, headline, and stamp. | Not `RawScores`; not the report *screen* (that UI is Issue 13). | `ScoredReport` type, return value of `scoreReport()` |
| Gate | A hard override rule (Speaking ≤ 2, or Motivation ≤ 2, or Study plan ≤ 2) that forces `KeepPracticing` regardless of total. | Not the same as "a low score" in general — only these three specific thresholds are gates. | `gatesFired: string[]` inside `scoreReport()` |
| Headline | The English readiness verdict: `"Ready"`, `"AlmostReady"`, or `"KeepPracticing"`. | Not "Pass"/"Fail"; not an exam grade. | `Headline` type, `ScoredReport.headline` |
| Stamp | The Japanese readiness label paired with `Headline`: 準備OK / もう少し / 要練習. | Not a certification mark; purely `Headline`'s Japanese twin. | `ScoredReport.stamp` |
| RubricCategoryKey | One of the six scoring categories: `speaking`, `listening`, `grammarPoliteness`, `motivation`, `studyPlan`, `consistency`. | Not a UI display label (Issue 13 will map these to human-readable names). | `RubricCategoryKey` type in `lib/content/rubric.ts` |
| RubricDoc | The generated, paste-into-n8n artifact: the Gemini prompt plus an equivalent dependency-free JS scoring snippet, both derived from the same source as `scoreReport()`. | Not the rubric module itself — it's a derived text artifact, snapshot-tested to catch drift. | `getRubricDoc()`, checked-in as `docs/rubric-generated.md` |
| Pitch mode | The `?pitch=1` URL flag that switches on 18:00-demo behavior: canned `PitchAnswer` captions instead of live translation, and a canned last-screen swap when the live headline isn't `Ready`. | Not the phone-clip audio itself (that's `PitchAnswer`); not a separate build or deployment. | `?pitch=1` query param, read starting in Issue 14 |
| InputMode | Whether a given answer was spoken (`"voice"`) or typed (`"typed"`) — determines whether Scribe runs and whether the "not checked for pronunciation" coaching line appears. | Not the camera on/off toggle — a separate, score-irrelevant control. | To be introduced in Issue 7 as `inputMode: "voice" \| "typed"` |
| Server-only module | Code under `lib/server/` that reads secrets and must never be imported by a `"use client"` file. | Not `lib/content/` — that data is non-secret and safe to import anywhere, including client components. | `lib/server/env.ts` convention (`getElevenLabsKey()`, etc.) |

## Relationships Between Terms

An **Interview** consists of exactly 3 **Questions**, each answered once
(voice or typed, tracked as **InputMode**) — never re-asked, never scored
mid-call. In **Pitch mode**, a Question's real-time answer is ignored for
HUD captions; the matching **PitchAnswer** (by index) is shown instead,
regardless of what was actually said or heard.

After all 3 answers, an LLM grading pass produces **RawScores**, which
`parseRawScores` validates and `scoreReport` turns into a **ScoredReport** —
applying weights to each **RubricCategoryKey**, checking both **Gates**,
and deriving exactly one **Headline** with its matching **Stamp**.
`getRubricPrompt()` (asks the LLM for RawScores) and `scoreReport()`
(pure math) are the two halves combined into **RubricDoc**, generated
from the same private weight/gate constants so n8n and `/api/grade`
can't silently diverge.

**Profile** is displayed only through its **Display card fields** subset;
other Profile fields exist purely for scoring/consistency checks and are
never rendered on screen.

## Boundaries

- No user accounts, no database — **Profile** is a single hardcoded
  fixture, not a queryable or persisted entity.
- Scribe/Wispr transcription internals are outside this domain's model —
  we only track a resulting transcript string and an **InputMode** flag,
  never audio-processing details.
- n8n's workflow internals (its UI, its nodes) are not modeled in code —
  only the **RubricDoc** text artifact and the webhook request/response
  contract are.
- Exam/certification concepts — N5, JLPT, A1, Pass, Fail — are explicitly
  outside this domain's vocabulary. **Headline**/**Stamp** are readiness
  signals, never grades or certifications.

## Changelog

| Date | Term added/changed | Reason |
|------|--------------------|--------|
| 2026-08-18 | All 15 core terms | Initial dictionary, generated in Mode B from Issues 1-2 code plus `docs/prd-nihongo.md` / `context.md`, after the fact rather than during grill-me. |
