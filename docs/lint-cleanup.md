# Lint cleanup checklist

Recorded 2026-09-24 from `npm run lint`: **28 errors and 5 warnings** in 14 files. Lint is a code checker; these findings do not prove a visitor-facing bug. The test suite, TypeScript check, and webpack production build passed when this list was created.

Run `npm run lint` again before working on this list. Line numbers may move as code changes. Fix one group at a time, run its relevant tests, and rerun lint. Keep the rules enabled so the final lint command can pass.

## 1. Interview recording controls — 16 errors

| File | Lines | Rule | Plain meaning |
| --- | --- | --- | --- |
| [`app/call/useAnswerCapture.ts`](../app/call/useAnswerCapture.ts) | 81–83, 89–92, 338–339, 360 | `react-hooks/refs` (16) | Recording and answer-control refs are read or changed while React is drawing the screen. Move that work to an event handler or effect, or use state for values displayed on screen. |

Several lint messages point to the same lines. Check the **Answer again**, auto-speak, recording reset, and submit paths after changing this hook.

## 2. State updated immediately in effects — 10 errors

| File | Lines | Count |
| --- | --- | ---: |
| [`app/auth/HashSessionCatcher.tsx`](../app/auth/HashSessionCatcher.tsx) | 30 | 1 |
| [`app/call/page.tsx`](../app/call/page.tsx) | 94, 112, 149 | 3 |
| [`app/call/useCameraStream.ts`](../app/call/useCameraStream.ts) | 52 | 1 |
| [`app/call/useDeliverySignals.ts`](../app/call/useDeliverySignals.ts) | 38 | 1 |
| [`app/call/useMicToggle.ts`](../app/call/useMicToggle.ts) | 19 | 1 |
| [`app/call/useQuestionFlow.ts`](../app/call/useQuestionFlow.ts) | 50 | 1 |
| [`app/components/ParticipantLoginDialog.tsx`](../app/components/ParticipantLoginDialog.tsx) | 33 | 1 |
| [`app/components/useUiLocale.ts`](../app/components/useUiLocale.ts) | 34 | 1 |

Rule: `react-hooks/set-state-in-effect`. An effect changes state immediately, making React draw again. For each case, check whether the value can be calculated during render or initialized when state is created. Preserve real external event handling in effects.

## 3. Smaller errors — 2 errors

| File | Line | Rule | Fix to consider |
| --- | ---: | --- | --- |
| [`app/guest/page.tsx`](../app/guest/page.tsx) | 52 | `@next/next/no-html-link-for-pages` | Use Next's `Link` component for the internal `/` link. |
| [`lib/content/deliverySignals.ts`](../lib/content/deliverySignals.ts) | 132 | `prefer-const` | Declare `firstVoice` with `const` if it is never reassigned. |

## 4. Warnings — 5 warnings

| File | Lines | Rule | Plain meaning |
| --- | --- | --- | --- |
| [`app/call/InterviewReportScreen.tsx`](../app/call/InterviewReportScreen.tsx) | 215 | `react-hooks/exhaustive-deps` | An effect uses `onRevealComplete` without listing it as a dependency. Check when that callback can change. |
| [`app/call/useAnswerCapture.test.ts`](../app/call/useAnswerCapture.test.ts) | 815, 884, 961 | `@typescript-eslint/no-unused-vars` | Three test callback parameters are unused. |
| [`app/layout.tsx`](../app/layout.tsx) | 52 | `@next/next/no-page-custom-font` | Review how the custom font is loaded. |

This is a snapshot, not a claim that every finding causes a bug. The single finding in `HashSessionCatcher.tsx` was also present in the committed version before the entry-flow change.
