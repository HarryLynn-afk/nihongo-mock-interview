# PRD — Direct Join (no Profile card)
**Status:** Draft
**Date:** 2026-08-28
**Built by:** Kyaw Naing Lin

---

## Problem
Friends who test NihonGo currently land on Aung Min Khant’s locked Profile card and then answer Tanaka-sensei’s Questions as that character. Feedback is about a pitch persona, not a real Interview. Sign-in would add more friction before the first Question.

## Goal
A tester on desktop opens `/`, sees NihonGo + Join (no Profile card), completes the 3-question Interview as themselves, and sees an honest Interview Readiness report. Consistency is scored from the three answers agreeing with each other, not from a written Profile.

## Users
Friends (about 10–15 later) trying the live Interview for a smooth demo. The same path is used by the builder. Not a logged-in account holder. Not an agency or school official.

## Requirements

### Must Have
- Start screen shows **NihonGo**, subtitle **Japanese language school interview practice**, and **Join interview**. No Profile card and no Aung Min Khant name/age/hometown/education/plan/sponsor on `/`.
- Desktop CSS gate unchanged: narrow viewports still see “Open on a computer to join the interview.”
- Join still opens the existing device check, then the 15s reminder (Skip), then `/call`. No sign-up, password, or email field.
- `POST /api/score` / n8n / `runGroqGrade` send `{ answers }` only. They must not attach the locked Aung Min Khant Profile.
- Rubric **consistency** (weight 10) means: the three answers match each other (same person, same plan, no contradictions). Not “spoken answers vs written Profile.”
- `getRubricDoc()` / `docs/rubric-generated.md` stay in sync with that wording so n8n can be re-pasted.
- Groq-produced `InterviewReport.profileName` is not Aung Min Khant (empty or a generic label). Dual-fail sample may keep canned scores; it must not be presented as that student’s identity on the start screen.
- Splash, Zoom bar, and report headline still never print N5, JLPT, A1, Pass, or Fail.

### Should Have
- `?pitch=1` may still skip Join overlays and show locked EN/MY captions by question index (presentation captions, not a Profile card).
- After this ships, re-paste the new rubric prompt into the published n8n **NihonGo grade** workflow.

### Must NOT Have (explicit exclusions)
- Sign-in, accounts, database, or a Profile create form in this change.
- Rendering Aung Min Khant’s display card on `/` for testers or for Pitch mode.
- Sending the locked Profile in the grade payload (that is Approach C — hide the card, keep scoring the character).
- Removing the six-category rubric or reweighting totals in this change (consistency stays 10 points; only its meaning changes).
- CSC 485 research question, survey, or ethics protocol (deferred).
- Netlify deploy (Issue 15 stays separate; deploy when the demo feels right).

## Technical Constraints
- Existing stack: Next.js App Router, thin route handlers, `lib/content/rubric.ts` as the only copy of weights/gates/headline math.
- `lib/content/profile.ts` may remain as a fixture file; it must not be imported by the start screen or by `/api/grade` / `/api/score` graders.
- n8n must never call `/api/grade`. Client still POSTs `/api/score` once after Scribe `ready`.
- Ask before spending `.env.local` keys. This change is local tests only.

## Open Questions
- Whether to delete Pitch-mode last-screen swap (`selectDisplayedReport`) so a weak live Headline always shows. Out of this PRD unless we reopen it.
- Whether to delete `ProfileCard` and `lib/content/profile.ts` entirely, or leave unused fixtures.
- Exact `profileName` string on Groq reports (`""` vs `"Student"`).

## Success Criteria
- `npm test`: start screen has Join and no Aung Min Khant display fields.
- Grade helpers’ posted JSON has `answers` and no `profile` object.
- `getRubricPrompt()` describes consistency as answer-to-answer; `rubricDoc.test.ts` snapshot matches `docs/rubric-generated.md`.
- A desktop Join still reaches `/call` via the existing lobby + reminder.

## Dependencies
- Current `/` Join + lobby (`JoinInterview`, `useInterviewLobby`).
- `gradeInterview` / `runGroqGrade` / `getRubricPrompt`.
- n8n re-paste after rubric snapshot update (manual; not blocked for local demo).
