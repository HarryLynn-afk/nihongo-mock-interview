# Issues — Type Restore to Speak or Type (from docs/prd-type-restore-choice.md)

Vertical slices so a student on Type can return to **Speak or Type** for the same Question without submitting.

For each issue: `/build-plan` before starting, `/tdd` while building, `/after-task` when done.

---

## 19. Restore Speak or Type from the Type dock

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** none

### Context
Type is one-way today: **Type answer**, or empty Speak + **Submit answer**, leaves the student in the text box until they submit (`docs/prd-type-restore-choice.md` Must Have). They need a **Speak or type** control that returns the student turn to **choose**.

### Task
Add `onSpeakOrType` from `useAnswerCapture` that sets the student turn back to **choose** and clears the typed draft. On the Type answer dock, render a **Speak or type** button under the answer box and above **Submit answer**, styled like **Type answer** (`bg-paper/10`), not indigo. Show it on every Type screen, including empty-Speak → Type. Do not add this control on Speak (listening or paused). After restore, **Speak answer** still starts listening; **Type answer** opens an empty box. Do not submit, do not change `InputMode`, do not add a route.

### Acceptance Criteria
- [x] Type screen (after **Type answer**) shows a button named **Speak or type**
- [x] Empty Speak + **Submit answer** Type screen also shows **Speak or type**
- [x] Pressing it hides the answer box and **Submit answer**, and shows **Speak answer** + **Type answer** again
- [x] Typed draft is cleared; choosing **Type answer** again shows an empty box
- [x] Speak listening/paused does not show **Speak or type**
- [x] Submit is not called; the Question does not advance

### Technical Notes
- `app/call/useAnswerCapture.ts`: public API stays `studentTurn: "none" | "choose" | "speak" | "type"`. Restore is `setAnswerMode(null)` plus `setDraft("")`.
- `app/call/page.tsx`: Type dock only — button under the textarea, above **Submit answer**.
- Tests: `useAnswerCapture.test.ts`, `page.test.tsx`.
- Ubiquitous language: **Speak answer**, **Type answer**, **Submit answer**, student turn, **Question**. Not “mode switcher” or “back”.

### Out of Scope
Pitch-mode `autoSpeak` re-entry after restore (Issue 20). Restore from Speak. Keeping typed text. Pause control. Grading, Scribe, `InputMode` on restore. New routes or modals.

---

## 20. Keep restore on the choice screen in Pitch mode

**Type:** Feature
**Size:** Small (< 2hrs)
**Depends on:** 19

### Context
Pitch mode (`?pitch=1`) uses `autoSpeak`, which currently sets Speak whenever `answerMode === null`. Restore in Issue 19 uses that same `null` to mean **choose**, so pitch would immediately jump back into Speak and the **Speak or type** button would do nothing (`docs/prd-type-restore-choice.md` Must Have: pitch restore must show the choice).

### Task
Make `autoSpeak` apply only on the first student-turn entry, not every time `answerMode` is `null`. After Type restore in pitch, the dock stays on **Speak or Type**. First load of a pitch student turn still auto-enters Speak. Empty Speak + Submit still opens Type; restore from that Type also stays on choose.

### Acceptance Criteria
- [x] `autoSpeak: true` still starts the student turn in Speak
- [x] After Type restore with `autoSpeak: true`, `studentTurn` stays `"choose"` (does not become `"speak"`)
- [x] `?pitch=1` on `/call`: **Speak or type** from Type shows **Speak answer** and **Type answer**, and does not immediately show listening
- [x] Non-pitch restore from Issue 19 still passes

### Technical Notes
- `useAnswerCapture`: track whether autoSpeak already ran for this active student turn; reset that flag when `active` becomes false (next Question).
- Tests: `useAnswerCapture.test.ts` (autoSpeak + restore), `page.test.tsx` if the call page already stubs pitch.
- Ubiquitous language: **Pitch mode**, student turn, **Speak answer**, **Type answer**.

### Out of Scope
Changing Pitch captions, last-screen swap, or `selectDisplayedReport`. Restore from Speak. Changing when empty Speak opens Type.
