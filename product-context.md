# NihonGo product context

Stable decisions only. Read when changing behavior, routes, auth, grading, research flow, or deployment. Current work and unresolved questions belong in `project-state.md`. Reopen a settled product decision only at the user's request.

## Purpose and scope

- CSC 492 is the working web app, deployment, documentation, presentation, and oral examination; CSC 485 is the research evaluation. The presentation starts with **Try a short practice** and its three locked Questions.
- One student, one Language School Interview track. Practice coaching only: never predict admission, financial eligibility, visa eligibility, or COE outcomes on any topic.
- Tanaka-sensei is the interviewer. The school name stays in the profile fixture, outside learner UI. Use domain terms from `docs/ubiquitous-language.md` when writing copy or domain documentation.
- Desktop-first, one light brand theme throughout. Use existing components; no shadcn/ui. English/မြန်မာ selects one helper language; Japanese stays on the HUD, without stacked translations.

## Entry and interview

- Anonymous **Try a short practice** opens the lobby dialog over `/`, then a 15s reminder overlay and `/call?guest=1`. Guest gets three locked Questions, no topic bank/follow-ups, and no consent. There is no guest practice while signed in.
- Google-only Participant entry uses the allowlisted normal landing or an open `/join?from=CODE`. Login is a dialog on `/login` (soft navigation uses `@modal`; hard navigation shows the start screen behind it).
- Known open invite codes reuse the normal landing. `/join` without a code or with an unknown code returns not-found. Full links hide Login/Join and show a dismissible popup; anonymous Guest practice remains available.
- Invite Google sign-up keeps the code and returns to that landing. Consent is required each sign-in visit after **Join Interview**, before device setup and `/call`. New invite enrollment consumes one slot; returning Participants consume none. Sign-out/Back to home returns to the originating invite landing while open, otherwise `/`. See `docs/participant-entry-flow.md`.
- Participant interviews draw 10 core Questions, one per topic, plus 0–3 deterministic follow-ups. Suppress a follow-up that substantially repeats the current core Question; no AI follow-up chooser.
- Voice-only: up to three failed Speak attempts, then skip that Question. **Answer again** allows one pre-Submit redo using the same STT engine. No typing or runtime TTS; sensei audio is committed `/question-{id}.mp3`.
- Speak auto-pauses after 10s without new transcript, without a popup. One Deepgram session per Speak attempt buffers audio during handshake; Pause stops capture and sends KeepAlive every 8s; Resume uses the same socket. Deepgram failure activates browser fallback.
- Lobby camera tracks stop on interview start/unmount. The call Camera toggle stops/restarts its stream and reattaches playback on remount. The lobby dialog and 15s overlay are shared; no extra Start interview button on `/call`.

## Grading and reports

- `/api/score` grades the confirmed Speak Submit transcript with Groq, then optional DeepSeek Flash with thinking off. Both miss → scoring unavailable. Shared grading helpers are not a second public endpoint. No n8n, Gemini, Whisper overwrite, or alternate background ASR.
- Five criteria on a 1–4 scale: Answer relevance 25%, Content completeness 25%, Japanese clarity 20%, Grammar and politeness 20%, Cross-answer consistency 10%. **Practice progress** is neutral feedback, with no pass threshold, Gates, Headline, or Stamp. Speaking delivery is not a score.
- Every graded answer carries question ID, topic, and Japanese question text. Grade meaning despite caption glitches; relevance is to that Question, consistency is across answers, and motivation/study-plan advice applies only where asked. Quote actual transcript evidence.
- Report layout is Overview (progress + radar), then Review (question navigation + one card): evidence, one improvement, and one example rewrite. ENG/MM report strings use locked locale templates. No Guest banner, Speech Delivery cards, recordings, or word-timestamp collection.
- Participant reports are saved server-side; save failures offer retry without regrading. **Help the study** is available for a signed-in Participant's saved real attempt. Validate ten ratings and three text responses; preserve delivery failure/uncertainty. Development Skip interview previews never submit externally.
- Anonymous Guest reports offer the email request, stored only in `full_session_requests`; the app sends no mail. No email step before practice and no repeat form after this visit submits. Session codes remain `G-` / `P-`.
- Development-only **Skip interview** can preview the sample report. Live grading never substitutes that sample on failure.

## Infrastructure and exclusions

- Next.js on planned Netlify hosting, optional Supabase for study login/storage. Build requires the Groq grading key; Deepgram, DeepSeek, research form URL, and Supabase are optional integrations. ElevenLabs is generate-time only. Consult configuration for exact environment variable names.
- Out of scope unless reopened: agency/COE decisions, Job Interview, separate Pitch/Guest routes, magic-link/SMTP login, runtime translation/TTS, background Whisper/Scribe, typing, phone-first redesign, in-app Play answer, sign-up solely to inflate user counts, and N5/JLPT/A1 report labels.
- Keep the landing focused: no profile card, glance pills, email-choice step, or ENG/MM selector inside the Google dialog. **Try a short practice** and **Join Interview** remain distinct Guest/Participant actions.
- Future proposals and live verification are listed in `project-state.md`. Historical alternatives and superseded decisions are preserved in `docs/archive/context-rotation-2026-10-11/`; read only when history is explicitly requested.
