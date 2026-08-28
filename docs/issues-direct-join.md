# Issues — Direct Join (from docs/prd-direct-join.md)

Vertical slices for Approach B: no Profile card, Join into the Interview, consistency from the three answers.

**CSC 485** research work is not in this list. **Issue 15** (Netlify) stays in `docs/issues-nihongo.md`.

Issues **16–17 are built** (2026-08-28). Remaining: **18** (re-paste RubricDoc into n8n).

For each issue: `/build-plan` before starting, `/tdd` while building, `/after-task` when done.

---

## 16. Remove Profile card from the start screen

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 3

### Context
Friends who test must Join an Interview as themselves. The start screen still showed Aung Min Khant’s Display card fields, so testers answered as a pitch persona (`docs/prd-direct-join.md` Must Have: no Profile card on `/`).

### Task
Stop rendering the Profile card on `/`. Keep NihonGo, the subtitle, Join interview, the desktop-only gate, and the existing device-check then 15s reminder then `/call` Join flow. Pitch mode (`?pitch=1`) must not show the card either.

### Acceptance Criteria
- [x] Start screen shows NihonGo, subtitle “Japanese language school interview practice”, and Join interview
- [x] Start screen does not show Aung Min Khant or Display card fields (name, age, hometown, education, plan, sponsor)
- [x] Narrow viewport still shows “Open on a computer to join the interview.”
- [x] Join still opens the device dialog, then the reminder (Skip), then navigates to `/call`
- [x] No sign-up, password, or email field on `/`
- [x] Splash still never prints N5, JLPT, A1, Pass, or Fail

### Technical Notes
- `app/page.tsx`: remove `ProfileCard`. Do not import `lib/content/profile.ts` from the start screen.
- Tests: `app/page.test.tsx`. Join/lobby stays in `JoinInterview` / `useInterviewLobby`.
- Ubiquitous language: **Profile** is a leftover fixture, not shown on `/`. **Interview** still starts after Join.

### Out of Scope
Sign-in, accounts, database, a Profile create form, Pitch-mode last-screen swap (`selectDisplayedReport`), deleting `ProfileCard.tsx` / `lib/content/profile.ts`, Netlify deploy (Issue 15).

---

## 17. Grade the Interview without a Profile; score consistency from the three answers

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 16, 11, 12

### Context
If the UI hides the card but `/api/score` still sends the locked Profile, Consistency is still “answers vs Aung Min Khant.” Direct Join requires the grader to see only the three answers (`docs/prd-direct-join.md` Must Have).

### Task
Change `gradeInterview` and `runGroqGrade` to POST `{ answers }` only (no Profile object). Change `getRubricPrompt()` so the **consistency** RubricCategoryKey means the three answers agree with each other (same person, same plan, no contradictions). Keep weights/Gates/Headline math unchanged (consistency stays 10 points). Regenerate RubricDoc so `docs/rubric-generated.md` matches. Groq `InterviewReport.profileName` must not be Aung Min Khant.

### Acceptance Criteria
- [x] `gradeInterview` n8n body has `answers` and no `profile` key
- [x] `runGroqGrade` user message is `{ answers }` and does not contain “Aung Min Khant”
- [x] Groq `InterviewReport.profileName` is empty (not Aung Min Khant)
- [x] `getRubricPrompt()` describes consistency as the three answers agreeing; it does not say “written profile”
- [x] `getRubricDoc()` snapshot matches `docs/rubric-generated.md`
- [x] Category weights, Gates, and Headline table are unchanged

### Technical Notes
- Files: `app/api/grade/gradeInterview.ts`, `app/api/grade/runGroqGrade.ts`, `lib/content/rubric.ts`, `docs/rubric-generated.md`.
- Tests: `gradeInterview.test.ts`, `runGroqGrade.test.ts`, `rubricPrompt.test.ts`, `rubricDoc.test.ts`.
- n8n must never call `/api/grade`. Client still POSTs `/api/score` once after Scribe `ready`.
- Do not spend a `.env.local` key on a live grade call while building this; unit tests mock `fetch`.
- Ubiquitous language: **RawScores** / **scoreReport** / **RubricDoc** / **InterviewReport**. **Consistency** is answer-to-answer, not answers vs **Profile**.

### Out of Scope
Re-pasting the prompt into the live n8n workflow (Issue 18). Reweighting or dropping the consistency category. Changing Pitch-mode captions or last-screen swap. Sign-in.

---

## 18. Re-paste RubricDoc into n8n and Publish

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 17

### Context
Issue 17 updated `docs/rubric-generated.md`. Production n8n still runs the old LLM prompt (consistency vs written Profile) unless the new RubricDoc is pasted and the workflow is Published (`docs/prd-direct-join.md` Should Have).

### Task
In the published **NihonGo grade** workflow, set the LLM node prompt to **Define below** (not `chatInput`) from the current `docs/rubric-generated.md` LLM section. Confirm the Code node still uses the generated `scoreReport` snippet from that same file. Publish (n8n Cloud has no “Active” toggle that replaces Publish). Do not point n8n at `/api/grade`.

### Acceptance Criteria
- [ ] n8n LLM prompt matches the current `docs/rubric-generated.md` system prompt (consistency = three answers; no pre-filled student card)
- [ ] n8n Code node still applies `scoreReport` from that RubricDoc (weights/Gates/Headline unchanged)
- [ ] Workflow is Published after the edit
- [ ] n8n still does not call `/api/grade`
- [ ] A local mocked test suite still passes without a live webhook (`npm test`)

### Technical Notes
- Ask before any live POST that spends `N8N_WEBHOOK_URL` or `GROQ_GRADE_API_KEY`.
- Webhook still receives `{ answers }` (Issue 17). If the LLM node reads `$json.body`, it must work without `profile`.
- Ubiquitous language: **RubricDoc**, **InterviewReport**, **Headline**.

### Out of Scope
Changing Next.js code. Netlify (Issue 15). Pitch-mode last-screen swap. Deleting `lib/content/profile.ts`. CSC 485 evaluation.

---

## Build order

16 → 17 → 18.

Issue **15** (deploy) stays independent and waits until the demo is good enough.

## Explicitly not issues (PRD Must NOT / Open Questions)

- Sign-in, accounts, database, Profile create form
- Pitch-mode last-screen swap (`selectDisplayedReport`) — reopen the PRD first
- Deleting unused `ProfileCard` / `profile.ts` fixtures
- CSC 485 research question or friend-test protocol
