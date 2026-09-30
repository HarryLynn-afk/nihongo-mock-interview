# Bug — Speech Delivery Signals always "Not assessed" (no audio saved)

**Severity:** Medium (report section broken; transcript + Answer Quality unaffected)
**Status:** Open
**Base commit:** `4a962f0 Make guest practice anonymous-only`
**Date:** 2026-10-01

> NOTE: there are **uncommitted working-tree changes** that touch this area
> (see "Uncommitted state" at the bottom). Decide whether to keep or discard
> them before starting. `git stash` gives a clean base at `4a962f0`.

---

## Symptom

After a normal spoken interview, the report's **Speech Delivery Signals**
section shows:

```
Speech Delivery Signals
Not assessed
Recording was too quiet or too short for basic timing analysis.
No audio was saved for this answer.
```

The last line is the key: the per-answer reason is **`empty`** — the answer's
audio clip is **0 bytes**. It is *not* a volume/threshold problem.

## Impact

- Delivery (duration / speech rate / pauses) is never measured; always "Not assessed".
- Transcript and the Answer Quality / coaching section are fine.
- Affects the Delivery section for Guest and Participant alike.

## Environment

- Next.js dev server on `http://localhost:3000`, Chrome/Edge.
- Deepgram configured and working (see Evidence).
- Reproduced in the Guest flow (`/` → **Try a short practice** → lobby → `/call?guest=1`).

## Steps to reproduce

1. `npm run dev`
2. Open `http://localhost:3000/`
3. Click **Try a short practice** (guest). In the lobby, turn the mic on, **Enter classroom**.
4. Answer the 3 Questions by voice (normal volume), Submit each.
5. Open the report → section **Speech Delivery Signals**.
6. Actual: "Not assessed" + "No audio was saved for this answer."
   Expected: "Clear enough" (or "Needs practice") with duration / speech rate / pauses.

## Evidence that Deepgram is NOT the problem

Server log during the session:

```
POST /api/deepgram-stt 200 in 1016ms
POST /api/deepgram-stt 200 in  947ms
POST /api/deepgram-stt 200 in  941ms
POST /api/score        200 in 1208ms
```

Live probe:

```
POST /api/deepgram-stt → HTTP 200
body: { accessToken: "<485 chars>" }
```

So the token route is configured and Deepgram responds. Transcription works.

## Where it fails (code map)

An answered Question carries `audioClip: Blob`. Delivery runs on that blob:

- `app/call/useDeliverySignals.ts` — if `answer.audioClip.size === 0`, it short-circuits
  to `notAssessedClip("empty")` without decoding.
- `app/call/analyzeAudioClip.ts` — returns `notAssessedClip("empty")` when `clip.size === 0`.
- `lib/content/deliverySignals.ts` — `notAssessedClip(reason)`; observation text map for
  `empty` is `"No audio was saved for this answer."`.
- `lib/content/uiCopy.ts` — `report.deliveryNote.notAssessed` is the generic note line
  (`"Recording was too quiet or too short for basic timing analysis."`), shown from
  `app/call/buildReportView.ts` for session status `notAssessed`.
- `app/call/InterviewReportScreen.tsx` — renders `view.delivery.note` plus
  `view.delivery.answers[0].observations`.

Delivery clip is produced in `app/call/useAnswerCapture.ts`:
- Deepgram path: `live.getPcm()` → `floatToWavBlob(...)` (`app/call/startLiveTranscription.ts`,
  `app/call/pcmAudio.ts`).
- Browser fallback (Deepgram session unavailable): previously a `MediaRecorder`
  (`audio/webm`). If the recorder produced no data, the clip becomes
  `new Blob([new Blob()])` → size 0.

## Diagnosis

`audioClip.size === 0`. Two ways that happens:

1. **Fallback path** — `startLiveTranscriptionSession` returned `null` (socket did not open
   within 3s, or capture setup threw) even though the token route works. Then the fallback
   `MediaRecorder` captured nothing, and the clip is empty. This matches a working transcript
   (from browser `SpeechRecognition`) plus an empty delivery clip.
2. **Deepgram path** — would require `live.getPcm()` to be empty, which contradicts a
   Deepgram transcript (the same Web Audio callback both fills the PCM buffer and sends to
   Deepgram). So if the transcript came from Deepgram, the clip should not be empty.

Conclusion: the report most likely ran the **browser fallback**, and the `MediaRecorder`
step saved no audio. A secondary possibility is a decode failure mislabeled as `empty`
(see next).

## Known sharp edge in the current code

`analyzeAudioClip` uses `notAssessedClip()` (default reason `empty`) for its
"no AudioContext" and "decodeAudioData failed" branches. So a non-empty but
**undecodable** clip (e.g. a `webm` that `decodeAudioData` rejects) is also reported
as **`empty`** and would print "No audio was saved for this answer." This can
mislead the diagnosis. Those branches should get a distinct reason
(e.g. `unreadable`).

## Hypotheses (ranked)

1. **Fallback MediaRecorder saves nothing** (most likely). A second `getUserMedia`
   and `MediaRecorder` for delivery is fragile; the mic is already held by other streams.
2. **Deepgram listen WebSocket fails to open in 3s**, forcing the fallback, even
   though the token route is fine.
3. **Decode failure mislabeled as `empty`** by the `analyzeAudioClip` default reason.

## Suggested direction (not prescriptive)

Use **one Web Audio PCM capture** for both transcription and delivery, so the clip exists
whenever the transcript does, and drop the separate `MediaRecorder`:

- Extract a `startPcmCapture()` module (getUserMedia + AudioContext + ScriptProcessor,
  output muted with gain 0) exposing `{ sampleRate, getSamples(), stop() }`.
- `startLiveTranscriptionSession` streams that capture's chunks to Deepgram and returns
  the capture as its PCM source.
- `useAnswerCapture` uses the same capture in the fallback and builds the WAV on Submit.

Also give `analyzeAudioClip`'s "can't decode / no AudioContext" branches a distinct
reason so "empty" always means "0 bytes".

**Do NOT** "fix" this by lowering the delivery thresholds
(`QUIET_RMS` / `SILENCE_RMS` in `lib/content/deliverySignals.ts`) — those are for a
different (volume) case and this bug is a missing recording.

## Acceptance criteria

- Guest and Participant, answering by voice, show a measured Delivery section
  ("Clear enough" / "Needs practice") with duration, speech rate, and pause count.
- No "No audio was saved for this answer." on a normal spoken answer.
- If audio genuinely is not captured, the reason is accurate (not a blanket message).
- `npm test` green, `npx tsc --noEmit` clean, `npm run lint` clean.

## How to verify / useful instrumentation

Audio is not persisted, so add temporary diagnostics if the cause is unclear:

- In `useAnswerCapture` submit path: log which branch ran (live vs fallback) and
  `audioClip.size`.
- In `startLiveTranscriptionSession`: log why it returns `null` (no token / socket
  not open / capture failed).

Then reproduce once and read the browser console.

## Out of scope

- Changing delivery thresholds or scoring.
- The research survey and the mic-level bar.

---

## Uncommitted state at time of writing

Working tree is dirty (not committed). If you want a clean base at `4a962f0`, run
`git stash`. The changes are:

- `lib/content/deliverySignals.ts`, `app/call/analyzeAudioClip.ts`,
  `app/call/useDeliverySignals.ts` (+ their tests) — add
  `notAssessedReason: "tooShort" | "tooQuiet" | "noSpeech" | "empty"` (this is what
  produces the "No audio was saved for this answer." line).
- `app/api/deepgram-stt/route.test.ts` — adds a "Deepgram rejects → 503" test.
- `app/call/pcmCapture.ts` (new), `app/call/startLiveTranscription.ts`,
  `app/call/useAnswerCapture.ts` (+ their tests) — a candidate fix: the unified
  PCM capture described above (removes `MediaRecorder`). **Not verified live**;
  tests are green (594/594) but the real-browser capture has not been re-tested.
