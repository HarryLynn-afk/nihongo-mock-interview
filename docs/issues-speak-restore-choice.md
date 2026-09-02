# Issues — Speak Restore to Speak or Type (from docs/prd-speak-restore-choice.md)

Vertical slice so a student on Speak can return to **Speak or Type** for the same Question without submitting.

Depends on Issues **19–20** (built). This voids Issue 19’s “do not show **Speak or type** on Speak.”

For each issue: `/build-plan` before starting, `/tdd` while building, `/after-task` when done.

---

## 21. Restore Speak or Type from the Speak dock

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 19, 20

### Context
After **Speak answer**, listening (or paused) plus **Submit answer** is one-way. Accidental Speak has no undo except empty Submit (which opens Type) or submitting voice (`docs/prd-speak-restore-choice.md` Must Have). Type already has **Speak or type**; Speak needs the same control.

### Task
Reuse `onSpeakOrType`. When leaving Speak, also reset the speak session: live caption, audio chunks, `speakPaused`. Do not reset `autoSpeakUsedRef` (Pitch must stay on **choose**). On the Speak dock, show the same **Speak or type** button (listening and paused), secondary `bg-paper/10`, above **Submit answer**. Keep the pause/listen mic. After restore, **Speak answer** starts a fresh listen; **Type answer** is an empty box. Do not submit. Update tests that currently assert Speak must not show **Speak or type**.

### Acceptance Criteria
- [x] Listening Speak dock shows **Speak or type** (same accessible name as Type)
- [x] Paused Speak dock also shows **Speak or type**
- [x] Pressing it hides live transcript and **Submit answer**, and shows **Speak answer** + **Type answer**
- [x] `onSubmit` is not called; the Question does not advance
- [x] After restore, **Speak answer** has no leftover caption; **Type answer** is empty
- [x] Pause still pauses; empty Speak + **Submit answer** still opens Type
- [x] `?pitch=1`: **Speak or type** from Speak stays on the choice (does not immediately listen)

### Technical Notes
- `useAnswerCapture`: `onSpeakOrType` should call the existing speak-session reset (caption, chunks, pause) plus `setAnswerMode(null)` and `setDraft("")`. Do not clear `autoSpeakUsedRef`.
- `app/call/page.tsx`: render **Speak or type** when `studentTurn === "speak" || studentTurn === "type"` (one button, one callback).
- Tests: `useAnswerCapture.test.ts`, `page.test.tsx` (replace the Issue 19 “does not show Speak or type while listening” case).
- Ubiquitous language: **Speak answer**, **Type answer**, **Submit answer**, student turn, **Pitch mode**.

### Out of Scope
Changing pause behavior. Removing empty-Speak → Type. New routes. Grading, Scribe, `InputMode` on restore. Redesigning `studentTurn` away from `null` = choose.
