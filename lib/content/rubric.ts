export type RubricCategoryKey =
  | "speaking"
  | "listening"
  | "grammarPoliteness"
  | "motivation"
  | "studyPlan"
  | "consistency";

export type RawScores = Record<RubricCategoryKey, 1 | 2 | 3 | 4 | 5>;

export type Headline = "Ready" | "AlmostReady" | "KeepPracticing";

export type ScoredReport = {
  headline: Headline;
  stamp: "準備OK" | "もう少し" | "要練習";
  total: number;
  scores: Record<RubricCategoryKey, { raw: number; weight: number; points: number }>;
  gatesFired: string[];
};

const CATEGORY_WEIGHTS: Record<RubricCategoryKey, number> = {
  speaking: 20,
  listening: 15,
  grammarPoliteness: 15,
  motivation: 20,
  studyPlan: 20,
  consistency: 10,
};

const CATEGORY_KEYS = Object.keys(CATEGORY_WEIGHTS) as RubricCategoryKey[];

const CATEGORY_DESCRIPTIONS: Record<RubricCategoryKey, string> = {
  speaking:
    "ignored for the practice total and Headline — never score fluency, pronunciation, pace, hesitation, or confidence from a transcript. Still return a speaking integer",
  listening: "answer relevance: did each answer actually match the question that was asked (not a listening-comprehension task)",
  grammarPoliteness: "です/ます, basic particles, not casual or broken speech",
  motivation: "why Japan, why this school, not anime/money/agent-driven reasons",
  studyPlan: "next step after graduation, language target, realistic timeline",
  consistency:
    "whether the answers agree with each other (same person, same plan, no contradictions)",
};

export const RAW_RATING_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Needs major improvement",
  2: "Needs improvement",
  3: "Developing",
  4: "Good",
  5: "Strong",
};

export type ScoreOptions = {
  assessSpeaking?: boolean;
};

export function assessedCategoryKeys(assessSpeaking: boolean): RubricCategoryKey[] {
  return CATEGORY_KEYS.filter((key) => assessSpeaking || key !== "speaking");
}

export function normalizePracticeTotal(
  scores: ScoredReport["scores"],
  assessSpeaking: boolean,
): number {
  const keys = assessedCategoryKeys(assessSpeaking);
  let earned = 0;
  let available = 0;
  for (const key of keys) {
    earned += scores[key].points;
    available += scores[key].weight;
  }
  if (available === 0) return 0;
  return Math.round((earned / available) * 100);
}

export function getRubricPrompt(): string {
  const categoryLines = CATEGORY_KEYS.map(
    (key) => `- ${key}: ${CATEGORY_DESCRIPTIONS[key]}`,
  ).join("\n");

  return [
    "You are grading a beginner Japanese language-school admission interview practice session.",
    "For each of these six categories, give an integer score from 1 to 5 (1 = needs major improvement, 3 = developing, 4 = good, 5 = strong for this practice response — never native-level, perfect, or an admission prediction):",
    categoryLines,
    "Also give exactly one quoted critique per answer: an exact-substring quote from that answer's transcript, a short English explanation grounded in that quote or a named missing rubric element, a Japanese rewrite, and exactly one category key from the list above.",
    "Quote must be copied from that transcript. Use （無言） as the quote only when the transcript is empty after trim.",
    "Rewrite is Japanese only. If rewrite equals quote, keep that phrase as a useful phrase (optional enhancement), even when forced is true. Only write a different rewrite when there is a real problem. If the rewrite differs from the quote, include Hiragana or Katakana. Never use （無言） as the rewrite.",
    "Never score pronunciation, fluency, pace, hesitation, or confidence from a transcript. The speaking integer is ignored for the practice total and Headline. The listening key means answer relevance, not a listening test.",
    "Do not tell the student to add a career or study goal if that answer already names a specific one. Do not invent evidence.",
    "There is no pre-filled student card. Score only from the answers in this session.",
    "Never use exam or certification labels in your scores or critiques.",
    'Return strict JSON: { "scores": { <category>: <1-5 integer>, ... }, "critiques": [{ "questionIndex": <0-based integer matching each answer>, "quote": <string>, "explanation": <English string>, "rewrite": <Japanese string>, "category": <category key> }] }',
  ].join("\n");
}

export function parseRawScores(json: unknown): RawScores {
  if (typeof json !== "object" || json === null) {
    throw new Error("Invalid rubric scores: expected an object");
  }

  const candidate = json as Record<string, unknown>;
  const result = {} as RawScores;

  for (const key of CATEGORY_KEYS) {
    const value = candidate[key];
    if (value === undefined) {
      throw new Error(`Invalid rubric scores: missing category "${key}"`);
    }
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(
        `Invalid rubric scores: category "${key}" must be an integer from 1 to 5, got ${JSON.stringify(value)}`,
      );
    }
    result[key] = value as RawScores[RubricCategoryKey];
  }

  return result;
}

function generateScoringSnippet(): string {
  const weightsLiteral = JSON.stringify(CATEGORY_WEIGHTS, null, 2);
  return [
    "// Auto-generated from lib/content/rubric.ts — JS twin of scoreReport",
    "// for the checked-in RubricDoc snapshot.",
    "function scoreReport(rawScores) {",
    `  const weights = ${weightsLiteral};`,
    "  const scores = {};",
    "  let earned = 0;",
    "  let available = 0;",
    "  for (const key of Object.keys(weights)) {",
    "    const raw = rawScores[key];",
    "    const weight = weights[key];",
    "    const points = (raw / 5) * weight;",
    "    scores[key] = { raw, weight, points };",
    "    if (key !== 'speaking') { earned += points; available += weight; }",
    "  }",
    "  const total = available === 0 ? 0 : Math.round((earned / available) * 100);",
    "  const gatesFired = [];",
    "  if (rawScores.motivation <= 2) gatesFired.push('motivation');",
    "  if (rawScores.studyPlan <= 2) gatesFired.push('studyPlan');",
    "  const isReady =",
    "    gatesFired.length === 0 &&",
    "    total >= 75 &&",
    "    rawScores.motivation >= 4 &&",
    "    rawScores.studyPlan >= 4;",
    "  let headline, stamp;",
    "  if (gatesFired.length > 0) { headline = 'KeepPracticing'; stamp = '要練習'; }",
    "  else if (isReady) { headline = 'Ready'; stamp = '準備OK'; }",
    "  else { headline = 'AlmostReady'; stamp = 'もう少し'; }",
    "  return { headline, stamp, total, scores, gatesFired };",
    "}",
  ].join("\n");
}

/**
 * The single checked-in artifact of the Groq grade prompt plus a
 * dependency-free JS twin of scoreReport(), both generated from the
 * same source as getRubricPrompt()/scoreReport() in this file.
 * lib/content/rubricDoc.test.ts fails if docs/rubric-generated.md is stale.
 */
export function getRubricDoc(): string {
  return [
    "# NihonGo rubric — Groq grade prompt",
    "",
    "## Groq system prompt",
    "",
    getRubricPrompt(),
    "",
    "## scoreReport JS twin",
    "",
    generateScoringSnippet(),
    "",
  ].join("\n");
}

export function scoreReport(
  rawScores: RawScores,
  options: ScoreOptions = {},
): ScoredReport {
  const assessSpeaking = options.assessSpeaking ?? false;
  const scores = {} as ScoredReport["scores"];

  for (const key of Object.keys(CATEGORY_WEIGHTS) as RubricCategoryKey[]) {
    const raw = rawScores[key];
    const weight = CATEGORY_WEIGHTS[key];
    const points = (raw / 5) * weight;
    scores[key] = { raw, weight, points };
  }

  const total = normalizePracticeTotal(scores, assessSpeaking);

  const gatesFired: string[] = [];
  if (assessSpeaking && rawScores.speaking <= 2) {
    gatesFired.push("speaking");
  }
  if (rawScores.motivation <= 2) {
    gatesFired.push("motivation");
  }
  if (rawScores.studyPlan <= 2) {
    gatesFired.push("studyPlan");
  }

  const isReady =
    gatesFired.length === 0 &&
    total >= 75 &&
    rawScores.motivation >= 4 &&
    rawScores.studyPlan >= 4 &&
    (!assessSpeaking || rawScores.speaking >= 4);

  let headline: Headline;
  let stamp: ScoredReport["stamp"];
  if (gatesFired.length > 0) {
    headline = "KeepPracticing";
    stamp = "要練習";
  } else if (isReady) {
    headline = "Ready";
    stamp = "準備OK";
  } else {
    headline = "AlmostReady";
    stamp = "もう少し";
  }

  return { headline, stamp, total, scores, gatesFired };
}
