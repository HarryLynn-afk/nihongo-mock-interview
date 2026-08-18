# Chat Context Handoff

## Purpose

Preserve grill-me decisions across sessions. Continue the interview from the last unresolved question. Do not reopen locked branches unless the user explicitly asks.

## Session metadata

- Workspace: `/Users/kyawnainglin/Documents/nihongo-mock-interview`
- Product working title: NihonGo! / HanGo! (name not locked)
- Skill in progress: grill-me
- Next skill after grill-me completes: ubiquitous-language, then write-prd, then Blueprint Launch Pack (zero operational app code)
- Do not write a PRD, blueprint, or application code until grill-me confirms shared understanding

## How to continue

Paste this into the next session if needed:

```text
Continue grill-me from the last unresolved question.
Use the locked decisions in context.md.
Do not reopen resolved branches unless I explicitly ask.
```

## Locked decisions

Treat these as fixed.

### Goal and scope

- First version is a 6-hour hackathon demo that proves the sponsor stack, not a full learner training product.
- Main judged lane is Japan, not Korea.
- Demo has two separate Japan tracks chosen at the start: Language School Interview and Job Interview. One session must not mix both.
- Judging priority is depth and realism in one track, not equal coverage of both.
- Polished main demo: Language School Interview.
- Secondary Job Interview: a different, lighter engine with a few questions. Not a placeholder, not a reuse of the language-school engine.

### Language School Interview

- Scenario: school admission interview. Not embassy/visa officer. Not a combined embassy + school sequence.
- Target level: JLPT N5.
- Interviewer speaks Japanese. English and Burmese subtitles are visible during the interview.
- Candidate input: voice primary, typing fallback.
- Main demo length: 3 questions, then report card, sized for about a 2-minute stage pitch.

Exact interviewer questions:

1. Self-Introduction (自己紹介): 「はじめに、簡単に自己紹介をお願いします。」
2. Motivation (志望動機): 「どうして日本で日本語を勉強したいのですか。この学校を選んだ理由も教えてください。」
3. Post-Study Plan (卒業後の進路): 「日本語学校を卒業した後は、何をする予定ですか。」

### Sponsor integrations and fallbacks

- Wispr Flow is the intended live transcription architecture. If hackathon API keys are unavailable, fall back to browser microphone transcription wrapped in the Wispr request/response schema.
- ElevenLabs is the intended live TTS path (`/v1/text-to-speech/stream`). If network latency exceeds 1.5 seconds, fall back to pre-rendered local `.mp3` files while keeping the ElevenLabs contract.
- n8n is the intended live grading webhook. If the webhook is slow or unavailable, fall back to a local evaluator using the identical payload contract.
- Local evaluator fallback is a small rule-based engine for N5 grammar, politeness, and vocabulary readiness. Not keyword-only matching. Not static hardcoded scores.

### Feedback and report card

- No scoring or diagnostic corrections during the interview.
- Sidebar during the interview: progress/status and live speech transcription only.
- Report card appears only after all 3 questions.
- Report card is one unified screen with two sections: candidate coaching and Agency Review.
- Demo UI label is Application Readiness Risk: Low / Medium / High. Do not label it Visa Risk Score.
- Candidate coaching covers politeness markers, filler-word penalties, and N5 grammar tips.
- Agency Review includes Application Readiness Risk, COE submission status, and motivation consistency.
- Agency Review COE recommendations are a 3-option set. Ready to Submit is defined as: Low Risk applicants with verified N5 proficiency and clear, consistent study plans; action is proceed with COE application. Needs Coaching and Hold Application names are accepted; their exact assignment rules are not fully locked yet.

### Evaluator signals

Self-introduction rewards: name, age, origin, education/job, Japanese study period and N5 level, one goal sentence, document consistency, understandable polite です/ます Japanese.

Self-introduction flags: cannot give basic personal info, document mismatch, robotic memorized speech, work/money focus, “live in Japan forever” with no study plan, very short or evasive answers.

Motivation rewards: specific study/career-linked reason, why Japan, consistency with background, researched school features, goal-school match, non-money-focused reasons.

Motivation flags: vague “I like Japan/anime”, work/money as main reason, no post-school plan, document contradictions, “my agent chose this school”, cheap/easy part-time work as the school reason, cannot name school features, wrong school information.

Post-study plan rewards: specific next step, Japanese linked to the plan, realistic timeline and JLPT target, consistency with earlier answers, study-first then visa change if needed.

Post-study plan flags: “I’ll decide later”, work/money-only plan, vague/unrealistic study plan, contradictions with earlier answers, working many hours instead of studying.

### Candidate profile fields required before evaluation

- Educational and employment background: highest degree and current employment status
- Stated purpose and motivation: pre-submitted written reason for studying in Japan
- Post-graduation plan: vocational school, university, or return home
- Target JLPT goal and study duration
- Financial sponsor: parents, self-sponsored, or other declared source

Spoken transcript is compared against these fields for contradictions, vague goals, and high-risk signals.

## Last unresolved question

Should the demo ask the user to fill those candidate profile fields live, or should it load a pre-filled Myanmar student profile to keep the 2-minute pitch fast?

## Open branches still to grill

Ask only after the current question is resolved. Do not skip.

- Exact assignment rules for Needs Coaching and Hold Application
- Product name: NihonGo! vs HanGo! vs something else
- Exact pre-filled candidate persona, if a pre-filled profile is chosen
- Named school being simulated, and which school features are “true” for consistency checks
- Job Interview light engine: persona, question count, exact questions, scoring
- Overall interview score scale and report-card metrics besides Application Readiness Risk
- Whether follow-up questions are allowed after each main question
- Whether candidate webcam is required in the video-call UI
- Whether ElevenLabs Scribe and sound-effects are in the 6-hour demo
- Judge-facing success criteria and demo script constraints
- Build-during-event / Blueprint Launch Pack constraints, after product branches are closed
- Mobile vs desktop judge preview
- Auth, persistence, and whether interviews are saved
- Stack confirmation for the hackathon build window

## Explicitly not this version unless reopened

- Korea / EPS-TOPIK as the main judged flow
- A full usable learner training product as v1
- Live scoring or Keigo diagnostics during the interview
- Mixing language-school and job questions in one session
- Labeling the report Visa Risk Score
- Treating the app as an official immigration authority
