# NihonGo — Japanese interview practice

NihonGo helps students preparing for Japanese language-school admission interviews rehearse spoken answers and review AI-generated coaching. Learners hear questions from Tanaka-sensei, answer in Japanese, and receive feedback with transcript evidence and example rewrites. English and Burmese helper text supports the practice flow.

**In development — deployed preview.** [Open NihonGo](https://nihongointerview.netlify.app) on a desktop browser. Full production-flow verification and research evaluation remain pending.

## Short walkthrough

1. Choose **Try a short practice** on the home page. No account is needed for the three-question guest session.
2. Check your microphone and, optionally, camera, then enter the interview after the start reminder.
3. Listen to a Japanese question, select **Speak**, and answer aloud while live captions capture your response. Use **Hear again** to replay a question or **Answer again** for one redo before submitting.
4. Finish the interview to see **AI Interview Practice Feedback**: a five-category overview followed by a review of each answer, including a quote from your transcript, one improvement, and a Japanese example rewrite.
5. Choose **Practice again** to rehearse another session. If transcription or grading fails, the app provides troubleshooting or an unavailable message.

The walkthrough describes the implemented flow; it is not a recording of an end-to-end production test. Guest transcription depends on browser speech-recognition support and microphone permission.

## Implemented features

- **Voice interview practice:** three fixed guest questions; a broader topic bank and bounded follow-ups for invited research participants.
- **Interview controls:** question replay, pause/resume, one answer redo, live Japanese captions, and optional camera.
- **Transcript-based feedback:** five weighted criteria, per-answer evidence, and example rewrites. Groq is the primary grader, with an optional DeepSeek fallback.
- **Participant study flow:** Google sign-in, visit consent, capped invitation links, pseudonymous session storage in Supabase, report-save retry, and a configurable usefulness survey.
- **Reliability controls:** server-side provider keys, request validation, API rate limits, and explicit transcription, grading, and saving failure states.

Implemented means present in the code, not fully verified across production browsers and external services.

## My contribution

Project by **Kyaw Naing Lin**, developed for CSC 492 (Computer Science Project) alongside CSC 485 (Introduction to Research Methodology for Computer Science).

My work brings together the interview-practice requirements, the learner journey from device setup to feedback, and the question and rubric design. The project includes research into language-school interview formats and task-focused practice feedback, with evaluation of usefulness still pending.

Development is AI-assisted, including implementation, documentation, and automated test work. The codebase and tests are engineering artifacts; they do not establish that the feedback improves learning or predicts interview outcomes.

## How feedback works

The AI proposes levels from 1–4 for five criteria. Application code validates the response and calculates the weighted **Practice progress** percentage.

| Criterion | Weight |
| --- | --- |
| Answer relevance | 25% |
| Content completeness | 25% |
| Japanese clarity | 20% |
| Grammar and politeness | 20% |
| Cross-answer consistency | 10% |

Feedback is based on the confirmed transcript. It cannot assess pronunciation, fluency, delivery, or listening comprehension. Transcription errors can affect feedback, and AI-generated suggestions may be wrong. The percentage is a practice summary, not a certified language level, validated measure of improvement, or admission prediction. There is no pass/fail threshold.

See the [grading documentation](docs/grading-system.md) for the rubric, validation rules, and scoring formula.

## Planned work

- Complete production browser checks for sign-in, consent, voice capture, report saving, survey delivery, and sign-out.
- Review Burmese copy with a native speaker and complete participant consent and study procedures.
- Use tester completion times and feedback to revisit session length and question coverage.

## Evaluation still pending

The project does not yet establish feedback effectiveness. Learner usefulness, agreement with human review, and changes in answer quality need evaluation. Automated tests check software behavior; they do not validate the rubric or demonstrate learning gains.

## Technology and local setup

**Next.js · React · TypeScript · Tailwind CSS · Vitest · Supabase · Groq · DeepSeek · Deepgram · Netlify**

```bash
npm install
cp .env.example .env.local
# Set GROQ_GRADE_API_KEY in .env.local for grading and production builds.
npm run dev
```

Guest practice does not require Supabase. A supported desktop browser and microphone are required for voice answers. Keep `.env.local` private.

```bash
npm test
npm run lint
npm run build
```

See the [development guide](DEVELOPMENT.md) for environment variables, optional Supabase setup, architecture, and deployment notes.
