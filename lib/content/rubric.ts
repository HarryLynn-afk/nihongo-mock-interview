export type RubricCategoryKey =
  | "answerRelevance"
  | "contentCompleteness"
  | "japaneseClarity"
  | "grammarPoliteness"
  | "consistency";

export type RawScores = Record<RubricCategoryKey, 1 | 2 | 3 | 4>;

export type ScoredReport = {
  total: number;
  scores: Record<
    RubricCategoryKey,
    { raw: number; weight: number; points: number }
  >;
};

const CATEGORY_WEIGHTS: Record<RubricCategoryKey, number> = {
  answerRelevance: 25,
  contentCompleteness: 25,
  japaneseClarity: 20,
  grammarPoliteness: 20,
  consistency: 10,
};

export const RUBRIC_CATEGORY_KEYS = Object.keys(
  CATEGORY_WEIGHTS,
) as RubricCategoryKey[];

const CATEGORY_DESCRIPTIONS: Record<RubricCategoryKey, string> = {
  answerRelevance: "did the answer actually address the question that was asked",
  contentCompleteness:
    "did the answer give enough useful details for that question; judge question-specific motivation and study-plan content here as coaching, never as separate scores",
  japaneseClarity:
    "is the meaning understandable, even with beginner mistakes",
  grammarPoliteness:
    "です/ます and basic particles, not casual or broken speech",
  consistency:
    "whether the answers agree with each other (same person, same school, same plan, no contradictions)",
};

export const PRACTICE_LEVEL_LABEL: Record<1 | 2 | 3 | 4, string> = {
  1: "Needs improvement",
  2: "Developing",
  3: "Adequate for practice",
  4: "Strong practice response",
};

const LEVEL_SCALE = `1 = ${PRACTICE_LEVEL_LABEL[1]}, 2 = ${PRACTICE_LEVEL_LABEL[2]}, 3 = ${PRACTICE_LEVEL_LABEL[3]}, 4 = ${PRACTICE_LEVEL_LABEL[4]}`;

export function scoreReport(rawScores: RawScores): ScoredReport {
  const scores = {} as ScoredReport["scores"];
  let earned = 0;
  let available = 0;

  for (const key of RUBRIC_CATEGORY_KEYS) {
    const raw = rawScores[key];
    const weight = CATEGORY_WEIGHTS[key];
    const points = (raw / 4) * weight;
    scores[key] = { raw, weight, points };
    earned += points;
    available += weight;
  }

  return {
    total: available === 0 ? 0 : Math.round((earned / available) * 100),
    scores,
  };
}

export function getRubricPrompt(): string {
  const categoryLines = RUBRIC_CATEGORY_KEYS.map(
    (key) => `- ${key}: ${CATEGORY_DESCRIPTIONS[key]}`,
  ).join("\n");

  return [
    "You are grading a beginner Japanese language-school admission interview practice session.",
    `For each of these five categories, give an integer score from 1 to 4 (${LEVEL_SCALE}). These levels describe a practice response only — never native-level Japanese, never a real interview result, and never an admission prediction:`,
    categoryLines,
    "Also give exactly one quoted critique per answer: an exact-substring quote from that answer's transcript, a short English explanation grounded in that quote or a named missing rubric element, a Japanese rewrite, and exactly one category key from the list above.",
    "Quote must be copied from that transcript. Use （無言） as the quote only when the transcript is empty after trim.",
    "Rewrite is Japanese only. If rewrite equals quote, keep that phrase as a useful phrase (optional enhancement), even when forced is true. Only write a different rewrite when there is a real problem. If the rewrite differs from the quote, include Hiragana or Katakana. Never use （無言） as the rewrite.",
    "Only the transcript is available: never score speaking, pronunciation, fluency, pacing, hesitation, confidence, listening comprehension, or delivery. Answer relevance means whether each answer matched the question, not a listening test.",
    "Motivation and study-plan content still matters for relevant questions: coach it question by question inside contentCompleteness. Never return separate motivation or study-plan scores and never apply fixed weights to them.",
    "Each answer transcript is a live speech caption (speech-to-text / ASR), not a human-edited transcript. Grade meaning and rubric content; do not punish ASR glitches, homophone slips, or missing particles that look like caption artifacts. Do not invent a cleaner or corrected transcript. Quote must be copied only from the submitted transcript.",
    "Do not tell the student to add a career or study goal if that answer already names a specific one. Do not invent evidence.",
    "There is no pre-filled student card. Score only from the answers in this session.",
    "Never use exam or certification labels in your scores or critiques.",
    'Return strict JSON: { "scores": { <category>: <1-4 integer>, ... }, "critiques": [{ "questionIndex": <0-based integer matching each answer>, "quote": <string>, "explanation": <English string>, "rewrite": <Japanese string>, "category": <category key> }] }',
  ].join("\n");
}

export function parseRawScores(json: unknown): RawScores {
  if (typeof json !== "object" || json === null) {
    throw new Error("Invalid rubric scores: expected an object");
  }

  const candidate = json as Record<string, unknown>;
  const result = {} as RawScores;

  for (const key of RUBRIC_CATEGORY_KEYS) {
    const value = candidate[key];
    if (value === undefined) {
      throw new Error(`Invalid rubric scores: missing category "${key}"`);
    }
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 4
    ) {
      throw new Error(
        `Invalid rubric scores: category "${key}" must be an integer from 1 to 4, got ${JSON.stringify(value)}`,
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
    "    const points = (raw / 4) * weight;",
    "    scores[key] = { raw, weight, points };",
    "    earned += points; available += weight;",
    "  }",
    "  const total = available === 0 ? 0 : Math.round((earned / available) * 100);",
    "  return { total, scores };",
    "}",
  ].join("\n");
}

/**
 * The single checked-in artifact of the grade prompt plus a
 * dependency-free JS twin of scoreReport(), both generated from the
 * same source as getRubricPrompt()/scoreReport() in this file.
 * lib/content/rubricDoc.test.ts fails if docs/rubric-generated.md is stale.
 */
export function getRubricDoc(): string {
  return [
    "# NihonGo practice rubric — grade prompt",
    "",
    "## Grade system prompt",
    "",
    getRubricPrompt(),
    "",
    "## scoreReport JS twin",
    "",
    generateScoringSnippet(),
    "",
  ].join("\n");
}
