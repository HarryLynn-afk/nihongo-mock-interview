# PRD — Speak Restore to Speak or Type
**Status:** Draft
**Date:** 2026-09-02
**Built by:** Kyaw Naing Lin

This supersedes the Type-restore exclusion “no restore control on Speak” in `docs/prd-type-restore-choice.md`. Same undo, now on Speak.

---

## Problem
After **Speak answer**, the student is stuck on listening (or paused) plus **Submit answer**. Accidental Speak or a change of mind has no path back to **Speak or Type** except empty Submit (which opens Type) or submitting a voice answer. Pause only stops talking; it does not undo the Speak choice.

## Goal
On the Speak screen (listening or paused), the student can press **Speak or type**, land back on the **Speak or Type** choice for the same Question, and continue without submitting.

## Users
The student practicing on `/call` during `studentTurn === "speak"` (listening or paused), including pitch mode (`?pitch=1`). Not Type (already covered), not sensei, not the report, not the lobby.

## Requirements

### Must Have
- The same **Speak or type** control is visible on Speak: listening and paused.
- Pressing it restores `studentTurn` to **choose** (Speak answer + Type answer), not Type and not listening.
- Live caption, recorded clip, and pause state are cleared on restore (same idea as clearing the typed draft).
- Placement: secondary, above **Submit answer**, same `bg-paper/10` style as Type’s **Speak or type**. Pause stays on the red/amber mic.
- After restore, **Speak answer** still starts listening immediately; **Type answer** opens an empty box.
- Pitch mode uses the same restore. Issue 20 already keeps choose after `onSpeakOrType`; do not re-enable autoSpeak for this turn.
- Same Question, same `/call` answer dock. No new route. No scoring or `InputMode` until they submit.

### Should Have
- One **Speak or type** button shared for Speak and Type (same label, same callback `onSpeakOrType`).

### Must NOT Have (explicit exclusions)
- Not a replacement for pause (pause still pauses listening).
- Not empty-Submit → Type as the only Speak undo (that path stays, but is not enough).
- Not a one-click jump to Type.
- Do not keep the spoken transcript or audio clip across restore.
- Not undo after **Submit answer**.
- No new screen, modal, or route.
- No change to grading, Scribe, or `InputMode` until a later submit.

## Technical Constraints
- Stack: Next.js App Router, existing `useAnswerCapture` + `app/call/page.tsx`.
- Reuse `onSpeakOrType` and `studentTurn: "none" | "choose" | "speak" | "type"`.
- Restore from Speak must also reset speak session (caption, audio chunks, `speakPaused`), not only `answerMode` and typed `draft`.
- `autoSpeakUsedRef` (Issue 20) must stay set for this student turn so Pitch does not auto-jump back into Speak.
- Vitest: hook restore from Speak → choose, caption cleared, `onSubmit` not called; page shows **Speak or type** while listening and paused; click restores the choice; Pitch `?pitch=1` stays on choose.

## Open Questions
- None. Remaining calls mirror Type restore (clear capture, same button, Pitch once-per-turn autoSpeak).

## Success Criteria
- Listening and paused Speak docks show **Speak or type**.
- Pressing it returns Speak + Type, hides live transcript and Submit, does not submit.
- Choosing Speak again starts a fresh listen (no old caption). Choosing Type shows an empty box.
- Pause still pauses; empty Speak + Submit still opens Type.
- `?pitch=1`: restore from Speak stays on the choice.

## Dependencies
- Issues 19–20 (`onSpeakOrType`, once-per-turn `autoSpeak`) in `docs/prd-type-restore-choice.md` / `docs/issues-type-restore-choice.md`.
- `SpeakAnswerButton` pause/listen control stays as-is.
