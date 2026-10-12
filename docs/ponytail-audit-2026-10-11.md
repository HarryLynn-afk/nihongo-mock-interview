# Ponytail repository audit — 2026-10-11

What this repo does: NihonGo runs voice-only Japanese interview practice, grades transcripts, and saves invited participants' study results. This audit assumes a small study with dozens of testers, 2–3 users per IP, and a public guest path on the planned Netlify deployment.

Status: these 12 findings were open at audit time. This audit changed no application code.

Follow-up: findings **1–6 are fixed** on 2026-10-11; findings 7–12 remain open. The fixes passed all **671 tests** across 99 files, lint, and TypeScript checking. Real browser microphone, camera, and speech-recognition behavior has not been checked.

Follow-up (2026-10-12): findings **7 and 8 are fixed**; findings 9–12 remain open.

## Relationship to the previous fixes

These are additional findings after the fixes for [the 2026-10-09 audit](ponytail-audit-2026-10-09.md). They do not mean those fixes should be reverted.

- **Findings 1–6 existed before the previous audit fixes.** The same six temporary regression checks failed in the same ways against commit `0204a31`, before the fixes beginning with `10b7833`.
- **Finding 7 is a documentation gap associated with the fixes.** They added migrations `005`–`007`, but the setup instructions were not updated to include them.
- **Findings 8–12 existed before the fixes.** Their relevant code was unchanged by that fix series. Finding 9 is an acknowledged deployment follow-up; findings 11–12 are cleanup suggestions.

## Verification

- All **649 tests** across 99 test files passed.
- `npx tsc --noEmit --incremental false` and `npm run lint` passed.
- All six isolated PostgreSQL enrollment checks passed.
- Six temporary regression checks reproduced findings 1–6. These checks were outside the repository and were also replayed against `0204a31`.
- `npm run build` stopped at the environment precheck. A separate temporary directory with a dummy key in `.env.local` reproduced finding 8.

## Must fix

1. **Audio can keep transmitting after Pause** ([startLiveTranscription.ts:144](../app/call/startLiveTranscription.ts#L144)).
   - **What this is:** Resume opens a new microphone capture.
   - **Problem:** Resume, then Pause before microphone startup finishes. The late capture is accepted and sends audio while the interface says paused.
   - **Fix:** Invalidate pending captures on pause or stop, and stop any capture whose startup is no longer current. Test rapid pause/resume.
   - **If we skip it:** Students can transmit speech they believe is private.
   - **Resolution (2026-10-11):** Pause changes invalidate older microphone startups. Late captures are stopped, stale or paused audio callbacks cannot transmit, and Stop prevents further capture starts. Three test-first regressions cover late startup after Pause, overlapping resumes, and Stop during pending startup in [startLiveTranscription.test.ts](../app/call/startLiveTranscription.test.ts).

2. **A pending device request survives leaving the lobby** ([useLobbyDevices.ts:133](../app/call/useLobbyDevices.ts#L133)).
   - **What this is:** The lobby opens microphone and camera streams.
   - **Problem:** Start the microphone, navigate away, then let permission resolve. Cleanup stops existing streams but leaves the pending request marked active; its new stream is never stopped. The camera callback follows the same pattern.
   - **Fix:** Cancel pending device requests during cleanup and stop streams returned afterward. Test navigation while permission is pending.
   - **If we skip it:** Devices can remain active after their controls disappear.
   - **Resolution (2026-10-11):** Independent microphone and camera request versions discard stale successes and failures. Reset and lobby cleanup invalidate pending requests; late streams are stopped, and delayed microphone permission checks cannot update state after reset or departure. Seven test-first regressions in [useLobbyDevices.test.tsx](../app/call/useLobbyDevices.test.tsx) cover these lifecycle races. Device requests still start directly from toggle clicks for Safari permissions.

3. **Mic off/on drops the beginning of an answer when submitted** ([useAnswerCapture.ts:292](../app/call/useAnswerCapture.ts#L292)).
   - **What this is:** Submit chooses the transcript sent for grading.
   - **Problem:** Speak sentence A, turn the mic off/on, then speak sentence B. The caption shows A+B, but Submit takes the new Deepgram session's transcript: B only.
   - **Fix:** Preserve the transcript across sessions and combine it with the current session once. Test the submitted text, beyond checking the caption.
   - **If we skip it:** Feedback and saved research data omit words the student saw on screen.
   - **Resolution (2026-10-11):** Each live session keeps a snapshot of earlier sessions' text. Cleanup preserves its final and interim transcript, while Submit and browser fallback combine the prefix with the current session exactly once. Cancelled sessions cannot update a later answer. Four test-first regressions in [useAnswerCapture.test.ts](../app/call/useAnswerCapture.test.ts) cover submission after toggling, repeated toggles with interim speech, turn reset with late events, and provider failure after session replacement.

4. **Browser fallback drops earlier speech segments** ([useAnswerCapture.ts:171](../app/call/useAnswerCapture.ts#L171)).
   - **What this is:** Browser speech recognition handles Deepgram failures.
   - **Problem:** When one event finalizes two segments, the handler reads only the last one. The temporary check submitted sentence B and lost sentence A.
   - **Fix:** Process every changed result from `resultIndex`, preserving final text and replacing interim text. [MDN documents this event behavior](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionEvent/resultIndex).
   - **If we skip it:** The fallback can quietly produce incomplete answers.
   - **Resolution (2026-10-11):** Browser recognition appends final segments from `resultIndex` and rebuilds interim text from the complete current results list. Earlier final results are not appended again, and revised or removed interim text replaces the caption. Two test-first regressions in [useAnswerCapture.test.ts](../app/call/useAnswerCapture.test.ts) cover multiple final segments, partial interim updates, interim removal, finalization without duplication, and recognition restart.

5. **Sponsor-job feedback becomes advice about the student's goals** ([critiqueCopy.ts:76](../lib/content/critiqueCopy.ts#L76)).
   - **What this is:** The report adds optional advice to answers needing no correction.
   - **Problem:** Answering “父はITエンジニアです。” to “What work does your sponsor do?” produces advice to connect “this goal” to the choice of Japanese school. The helper treats the father's profession as the student's goal.
   - **Fix:** Pass the question topic into this helper and restrict goal advice to questions that ask about goals. Test the financial-support example through the report builder.
   - **If we skip it:** Correct financial-support answers receive unrelated coaching.
   - **Resolution (2026-10-11):** The report passes its question-bank topic into `buildNextStep`. Goal-specific advice requires both the `futurePlan` topic and the `contentCompleteness` category; other or unknown topics use generic advice. A test-first regression in [buildReportView.test.ts](../app/call/buildReportView.test.ts) checks sponsor-job answers, unknown topics, and specific/vague future goals in English and Burmese.

6. **A stalled token request never activates browser fallback** ([startLiveTranscription.ts:67](../app/call/startLiveTranscription.ts#L67), [mintListenToken.ts:14](../app/api/deepgram-stt/mintListenToken.ts#L14)).
   - **What this is:** Speak requests a Deepgram token before starting capture.
   - **Problem:** Neither the browser token request nor the server's grant request has a timeout. With an unresolved request, no browser recognition starts—even after 30 seconds in the temporary check.
   - **Fix:** Bound both requests and return the existing unavailable result on timeout. Test a request that stays pending, separately from one that rejects.
   - **If we skip it:** A slow connection leaves students speaking without transcription.
   - **Resolution (2026-10-11):** The browser token request aborts after 5s (including response parsing) and the server grant request after 3s, returning the existing unavailable result so browser fallback starts. Five test-first regressions cover pending, body-stalled, and rejecting requests in [startLiveTranscription.test.ts](../app/call/startLiveTranscription.test.ts) and [mintListenToken.test.ts](../app/api/deepgram-stt/mintListenToken.test.ts).

7. **The documented database setup cannot run the current app** ([README.md:89](../README.md#L89), [migration-check instructions](supabase-migration-check.md), [migration-check query](supabase-migration-check.sql)).
   - **What this is:** Setup instructions tell a new maintainer which migrations to apply.
   - **Problem:** The README omits required migrations `005`–`007`. Following it leaves allowlist consent without its enrollment function, report saving without required columns, and surveys without their status table. The migration-check documents also stop at `004`.
   - **Fix:** Document migrations `001`–`007` in order and update the check query to verify the current schema.
   - **If we skip it:** Fresh installations fail despite following the instructions.
   - **Resolution (2026-10-12):** The README setup step lists migrations `001`–`007` in order and the Table Editor check covers all six study tables. The migration-check query verifies the current schema — `study_sessions.attempt_id`/`report`, `survey_submissions` and its RLS, and both enrollment functions — and was replayed against a scratch PostgreSQL database with `001`–`007` applied; all 17 rows returned `t`.

8. **The build precheck ignores `.env.local`** ([check-env.mjs:7](../scripts/check-env.mjs#L7)).
   - **What this is:** `npm run build` checks required configuration before starting Next.js.
   - **Problem:** The script reads only exported environment variables. A temporary directory containing a valid dummy key in `.env.local` still failed; the normal build stopped at the same precheck.
   - **Fix:** Load Next.js environment files before checking, using its [documented environment loader](https://nextjs.org/docs/app/guides/environment-variables#loading-environment-variables-with-nextenv). Test configuration supplied only through an environment file.
   - **If we skip it:** The documented local setup cannot build unless users separately export the key.
   - **Resolution (2026-10-12):** The precheck loads env files with Next's own `@next/env` loader (`loadEnvConfig(process.cwd(), false)`), so it sees `.env.production.local`, `.env.local`, `.env.production`, and `.env` exactly as `next build` does; `@next/env` 16.3.8 is a declared devDependency. A test-first regression in [check-env.test.ts](../scripts/check-env.test.ts) covers a key supplied only through `.env.local`, and every script test now spawns in an isolated temp working directory so a developer's real env file cannot mask failures. `npm run prebuild` passes with the repo's `.env.local`; 672 tests across 99 files and lint pass.

9. **Rate limits do not hold across Netlify instances** ([guard.ts:14](../lib/server/security/guard.ts#L14)).
   - **What this is:** The guard limits requests to paid providers.
   - **Problem:** Each process owns its own counters. Two instances can each accept 20 requests from the same IP; a replacement instance starts empty. This is an acknowledged shortcut, but the planned serverless deployment crosses its stated limit. [Netlify describes functions as stateless](https://www.netlify.com/blog/intro-to-serverless-functions/).
   - **Fix:** Complete the documented shared rate-limit store before public deployment. Keep the existing guard interface and presets.
   - **If we skip it:** The configured limits will not reliably control provider usage.

10. **Join-link sign-in failures show no explanation** ([Home.tsx:82](../app/components/Home.tsx#L82)).
    - **What this is:** Continue with Google starts sign-in from an invite.
    - **Problem:** If the link fills after the page loads, the endpoint returns `{url:null}` and clicking Continue appears to do nothing. Network failures also have no visible error.
    - **Fix:** Handle failed responses and missing URLs, and use the dialog's existing message field to explain the failure. Test both outcomes.
    - **If we skip it:** Testers cannot tell whether to retry or request another invite.

## Should fix

11. **Both graders maintain the same response parser** ([runDeepseekGrade.ts:9](../app/api/grade/runDeepseekGrade.ts#L9), [runGroqGrade.ts:25](../app/api/grade/runGroqGrade.ts#L25)).
    - **What this is:** Both parsers remove reasoning blocks and Markdown fences, then extract JSON.
    - **Problem:** The same 27-line implementation exists twice. Every response-format fix requires two edits.
    - **Fix:** Keep one shared parser and retain both providers' request and error handling.
    - **If we skip it:** Provider parsing can drift during later fixes.

## Nice to have

12. **Retired profile code and an unused client remain** ([ProfileCard.tsx:1](../app/components/ProfileCard.tsx#L1), [adminClients.ts:15](../lib/server/study/adminClients.ts#L15)).
    - **What this is:** An old fictional student card and a stateless anonymous Supabase client.
    - **Problem:** Whole-tree searches found no runtime caller for either. The card's fixture and tests maintain a screen that was removed.
    - **Fix:** Delete the card, fixture, their two tests, and the unused client export.
    - **If we skip it:** Maintainers keep reading and testing retired behavior.

**Verdict:** Fix microphone privacy and transcript loss first; complete deployment safeguards before opening the public site. Keep the fixes from the previous audit.

**Lean: -150 lines, -0 dependencies possible**, approximately.

**Not checked:** Live OAuth, real browser devices, paid providers, deployed headers/IP handling, current dependency advisories, or detailed visual/translation review. The production build stopped at its precheck.

**Risk:** Passing existing tests does not cover the reproduced microphone privacy and answer-loss cases.
