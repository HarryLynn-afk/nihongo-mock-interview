# NihonGo rubric — paste into n8n

## Gemini node system prompt

You are grading a beginner Japanese language-school admission interview practice session.
For each of these six categories, give an integer score from 1 to 5:
- speaking: fluency, pronunciation/clarity, can they introduce themselves
- listening: did each answer actually match the question that was asked
- grammarPoliteness: です/ます, basic particles, not casual or broken speech
- motivation: why Japan, why this school, not anime/money/agent-driven reasons
- studyPlan: next step after graduation, language target, realistic timeline
- consistency: spoken answers vs. the student's written profile
Also give 2-4 short coaching notes in plain language (です/ます and beginner grammar terms are fine).
If an answer's inputMode is typed, score speaking only on whether they answered the question and used understandable です/ます — do not score pronunciation for that answer.
Never use exam or certification labels in your scores or notes.
Return strict JSON: { "scores": { <category>: <1-5 integer>, ... }, "coaching": [<string>, ...] }

## Code node (runs after the Gemini node)

// Auto-generated from lib/content/rubric.ts — paste into an n8n Code node
// that runs after the Gemini node, on its { scores } JSON output.
function scoreReport(rawScores) {
  const weights = {
  "speaking": 20,
  "listening": 15,
  "grammarPoliteness": 15,
  "motivation": 20,
  "studyPlan": 20,
  "consistency": 10
};
  const scores = {};
  let total = 0;
  for (const key of Object.keys(weights)) {
    const raw = rawScores[key];
    const weight = weights[key];
    const points = (raw / 5) * weight;
    scores[key] = { raw, weight, points };
    total += points;
  }
  const gatesFired = [];
  if (rawScores.speaking <= 2) gatesFired.push('speaking');
  if (rawScores.motivation <= 2) gatesFired.push('motivation');
  if (rawScores.studyPlan <= 2) gatesFired.push('studyPlan');
  const isReady =
    gatesFired.length === 0 &&
    total >= 75 &&
    rawScores.speaking >= 4 &&
    rawScores.motivation >= 4 &&
    rawScores.studyPlan >= 4;
  let headline, stamp;
  if (gatesFired.length > 0) { headline = 'KeepPracticing'; stamp = '要練習'; }
  else if (isReady) { headline = 'Ready'; stamp = '準備OK'; }
  else { headline = 'AlmostReady'; stamp = 'もう少し'; }
  return { headline, stamp, total, scores, gatesFired };
}
