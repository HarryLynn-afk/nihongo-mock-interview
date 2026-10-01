# NihonGo — Current grading system

**Last updated:** 2026-10-02
**Status:** Current. This replaces the earlier six-score verdict rubric (Ready / Almost Ready / Keep Practicing, 準備OK / もう少し / 要練習, fixed Motivation and Study plan weights, automatic-failure Gates, and the 75-point threshold).

> AI-generated practice feedback. This is not an official admission assessment or a professional language evaluation.

---

## Plain-language summary

The grader is a **practice coach**, not an admissions decision. It looks only at the confirmed transcript of the student's answers and reports how well each answer would work in a language-school admission interview. Every number is there to show progress across practice sessions — never to pass or fail anyone.

## The five things that get scored

| Criterion | Weight | What it checks |
|---|---|---|
| Answer relevance | 25% | Does the answer actually address the question? |
| Content completeness | 25% | Does it give enough useful details? This includes why Japan / why this school and the study plan — as question-by-question coaching, not separate scores. |
| Japanese clarity | 20% | Is the meaning understandable, even with beginner mistakes? |
| Grammar and politeness | 20% | です/ます, basic particles, not casual or broken speech |
| Cross-answer consistency | 10% | Do the answers agree with each other — same person, same school, same plan? |

## The four levels

Each criterion is rated:

1. **Needs improvement**
2. **Developing**
3. **Adequate for practice**
4. **Strong practice response**

These levels describe a practice response only. They are never native-level, never a real interview result, and never an admission prediction.

## How the overall number is made

Each level is scaled to its weight:

```text
points per criterion = (level / 4) × weight
Practice progress = round(sum of all points)
```

Worked examples:

- All five criteria at level 4 → **100%**
- Answer relevance 4 (25), Content completeness 4 (25), Japanese clarity 3 (15), Grammar and politeness 3 (15), Consistency 3 (7.5) → **88%**
- Answer relevance 3 (18.75), Content completeness 4 (25), Japanese clarity 2 (10), Grammar and politeness 4 (20), Consistency 3 (7.5) → 81.25 → **81%**
- Every criterion at level 3 → **75%** (just a number — 75 is not a pass threshold)

There is **no pass threshold, no automatic-failure rule, and no Ready / Almost Ready / Keep Practicing verdict**. Every level only moves the Practice progress percentage up or down. Cross-answer consistency is scored once across the whole session; the other criteria attach to per-answer feedback.

## Question context

Every graded answer carries its `questionIndex`, `questionId`, `topic`, the exact Japanese question (`questionJapanese`), the transcript, and `pushbackCount`.

- **Answer relevance** compares the transcript with that actual question. The API rejects an answer with no question text, so relevance is never guessed.
- **Content completeness** uses the question and its topic.
- **Motivation and study-plan** coaching applies only to questions that ask for them; it is never demanded on unrelated topics.
- **Financial-support** answers are judged on relevance, completeness, clarity, and consistency only. Eligibility language (financial, admission, visa, or COE) is rejected before a report is built.

## What is never graded

Only the written transcript is judged. The grader is explicitly instructed never to score:

- speaking, pronunciation, or fluency
- pacing, hesitation, or confidence
- listening comprehension
- delivery

Answer relevance means "did this answer match the question", not a listening test.

## What each answer shows

1. **Evidence** — a quote pulled from the student's own answer
2. **One improvement** — a single concrete thing to fix
3. **One example rewrite** — a natural Japanese version

If the answer is already strong, the improvement becomes an optional stretch tip instead of a correction, and the rewrite becomes a "useful phrase to keep."

## What's on the report screen

- Header: **Practice progress N%** — neutral styling, no stamp and no red/green verdict
- A five-axis radar and five bars, each labeled with its level
- Per-question cards with evidence, one improvement, and one rewrite
- The disclaimer below, in English and translated for the Burmese view:

> AI-generated practice feedback. This is not an official admission assessment or a professional language evaluation.

## Who does the grading

The AI model proposes the 1–4 ratings from the transcript:

1. **Groq** (`qwen/qwen3.8-27b`) is primary.
2. **DeepSeek Flash** (thinking disabled) is the fallback on any Groq miss.
3. If both miss, the app shows the sample practice report (`mocks/sample-report.json`) with a "Scoring unavailable — sample report." banner — never a blank screen.

The app itself does the weighting math; the model never decides the overall number. The model returns strict JSON:

```text
{ "scores": { <category>: <1-4 integer>, ... },
  "critiques": [{ "questionIndex": <0-based>, "quote": <transcript substring>,
                  "explanation": <English>, "rewrite": <Japanese>, "category": <key> }] }
```

One quoted critique per answer. The quote must be copied from that answer's transcript (`（無言）` only when the transcript is empty after trim). The rewrite is Japanese only; when it equals the quote it is shown as a useful phrase to keep.

## Scope and basis

The rubric follows the JF Standard's focus on **whether learners accomplish the communication task**. The Japan Foundation does not officially prescribe these exact criteria, percentages, or interface choices — they are our research-informed design decisions and are presented as practice feedback only.

## Removed from the old system

- Ready / Almost Ready / Keep Practicing verdicts and 準備OK / もう少し / 要練習 stamps
- Claims that the student will pass or fail a real interview
- Speaking, pronunciation, fluency, and listening scores from a transcript-only analysis
- Official JF / CEFR level labels
- The 75-point pass threshold and automatic-failure Gates
- Motivation and Study plan as separate fixed-weight scores (kept as question-specific coaching inside Content completeness)

## Where this lives (maintainers)

| Concern | File |
|---|---|
| Criteria, weights, levels, prompt, validation, scoring | `lib/content/rubric.ts` |
| Critique schema + quote validation | `lib/content/parseQuotedCritiques.ts` |
| Per-question coaching and Burmese templates | `lib/content/critiqueCopy.ts` |
| Report view model | `app/call/buildReportView.ts` |
| Report UI | `app/call/InterviewReportScreen.tsx` |
| Fallback sample | `lib/content/sampleReport.ts`, `mocks/sample-report.json` |
| Prompt snapshot (test-enforced) | `docs/rubric-generated.md` |
| Domain terms | `docs/ubiquitous-language.md` |

## Verification

- Full test suite: **586/586 passing**
- TypeScript: **0 errors**
- Lint: **0 errors / 0 warnings**
- `docs/rubric-generated.md` regenerated and snapshot-locked to the prompt and scoring math.
