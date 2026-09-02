# PRD — Type Restore to Speak or Type
**Status:** Draft
**Date:** 2026-09-02
**Built by:** Kyaw Naing Lin

---

## Problem
During the student turn on `/call`, choosing **Type answer** (or landing in Type after empty **Speak** + **Submit answer**) is one-way. The student cannot return to the **Speak or Type** choice for that Question. Accidental Type clicks and empty-Speak fallbacks trap them in the text box until they submit.

## Goal
On the Type screen, the student can press **Speak or type**, land back on the **Speak or Type** choice for the same Question, and continue without submitting.

## Users
The student practicing on `/call` during `studentTurn === "type"`, including pitch mode (`?pitch=1`). Not sensei, not the report screen, not the lobby.

## Requirements

### Must Have
- A **Speak or type** control is visible on every Type screen: after **Type answer**, and after empty Speak + **Submit answer**.
- Pressing it restores `studentTurn` to **choose** (Speak answer + Type answer), not straight into listening.
- Any typed draft is cleared on restore.
- Placement: under the answer box, above **Submit answer**. Style matches **Type answer** (secondary / `bg-paper/10`), not the indigo **Submit answer** button.
- After restore, **Speak answer** still starts listening immediately; **Type answer** opens an empty box.
- Pitch mode uses the same restore. Restoring must actually show **Speak or Type** — `autoSpeak` must not immediately force Speak again once the student has left Speak.
- Same Question, same `/call` answer dock. No new route. No scoring or `InputMode` change until they submit.

### Should Have
- Accessible name **Speak or type** (button role), so tests and screen readers match the visible label.

### Must NOT Have (explicit exclusions)
- No restore control on Speak (listening or paused). Pause stays the Speak stop-talking control; empty Submit still opens Type.
- Not a one-click jump into Speak / listening.
- Do not keep typed text across restore.
- Not undo after **Submit answer**.
- No new screen, modal, or route.
- No change to grading, Scribe, or `InputMode` until a later submit.

## Technical Constraints
- Stack: Next.js App Router, TypeScript, existing `/call` client tree (`useAnswerCapture`, `page.tsx`).
- Public state stays `studentTurn: "none" | "choose" | "speak" | "type"`.
- Domain terms stay **Speak answer**, **Type answer**, **Submit answer**, student turn (see `docs/ubiquitous-language.md`).
- Empty Speak + Submit still opens Type; that Type screen also shows restore.
- `autoSpeak` (pitch) currently sets Speak whenever `answerMode === null`. Restore sets choose via `null` — that interaction must be fixed so restore is not a no-op in pitch.
- Vitest + Testing Library: cover restore from Type, draft cleared, empty-Speak Type also shows the control, pitch restore does not auto-reenter Speak.

## Open Questions
- None from /grill-me. Remaining UX calls were delegated: Speak has no restore; pitch shares restore; label/placement as specified above.

## Success Criteria
- From Type, **Speak or type** is visible and returns the dock to Speak + Type with no submit.
- Typed text is gone if they choose Type again.
- Empty-Speak → Type also shows **Speak or type**.
- Speak listening/paused still has no restore control.
- `?pitch=1`: after Type, **Speak or type** shows the choice and does not immediately resume Speak.
- Existing Speak pause, empty-Speak → Type, and Submit paths still pass.

## Dependencies
- Existing student-turn machine in `useAnswerCapture` (`choose` / `speak` / `type`).
- Call-page answer dock in `app/call/page.tsx`.
- Pitch `autoSpeak` in `useAnswerCapture`.
- Existing tests in `useAnswerCapture.test.ts` and `app/call/page.test.tsx`.
