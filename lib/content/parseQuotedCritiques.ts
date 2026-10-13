import {
  RUBRIC_CATEGORY_KEYS,
  type RubricCategoryKey,
} from "./rubric";
import { hasJapaneseKana } from "./pushbackCheck";

const SILENT_QUOTE = "（無言）";

export type CritiqueAnswer = {
  questionIndex: number;
  transcript: string;
  topic?: string | null;
};

const FINANCIAL_ELIGIBILITY_CLAIM = /eligib|visa|\bcoe\b|admission/i;
const ELIGIBILITY_WARNING = /\b(?:avoid|do not|don't|never)\s+(?:claim(?:ing)?|say(?:ing)?|stat(?:e|ing))\s+(?:that\s+)?(?:(?:you|your|i|we|the student)\s+)?(?:(?:are|am|is)\s+)?$/i;
// shortcut: Phrase patterns cannot cover every paraphrase; use approved templates if that becomes required.
const ELIGIBILITY_CLAIMS = [
  /\b(?:eligible|ineligible|qualif(?:y|ies|ied)\s+for)\b/gi,
  /\b(?:visa(?:\s+application)?|admission|coe|scholarship)\s+(?:is|will be|has been)\s+(?:approved|guaranteed|denied|rejected)\b/gi,
  /\bwill\s+(?:get|receive|obtain)\s+(?:(?:a|an|the|your)\s+)?(?:visa|admission|coe|scholarship)\b/gi,
  /\bmeet(?:s)?\s+(?:the\s+)?(?:visa|admission|coe|scholarship|financial)\s+(?:requirements|criteria|conditions)\b/gi,
  /(?:ビザ|査証|在留資格|COE|ＣＯＥ|入学|奨学金|経済|財政)[^。！？\n]{0,40}?(?:資格が(?:あります|ありません)|(?:要件|条件)を満た(?:しています|していません))/gi,
  /(?:ビザ|査証|在留資格|COE|ＣＯＥ)(?:を|が|は)?(?:必ず|確実に|絶対に)?取得(?:することが)?でき(?:ます|ません)/gi,
  /(?:ビザ|査証|在留資格|COE|ＣＯＥ)(?:の?申請)?(?:を|が|は)?(?:必ず|確実に|絶対に)?(?:(?:発行|発給|許可|承認)され(?:ます|ません)|認められ(?:ます|ません))/gi,
  /入学(?:が|は)?(?:でき(?:ます|ません)|(?:可能|不可能)です)/g,
];

function hasEligibilityClaim(text: string): boolean {
  return ELIGIBILITY_CLAIMS.some((pattern) => {
    for (const match of text.matchAll(pattern)) {
      // Distinguish question か from assertions followed by から (because).
      if (/^か(?:[、。！？?!,\s」』]|と|どうか|$)/.test(text.slice(match.index + match[0].length))) continue;
      if (!ELIGIBILITY_WARNING.test(text.slice(0, match.index))) return true;
    }
    return false;
  });
}

export type QuotedCritique = {
  questionIndex: number;
  quote: string;
  explanation: string;
  rewrite: string;
  category: RubricCategoryKey;
};

export function parseQuotedCritiques(
  raw: unknown,
  answers: readonly CritiqueAnswer[],
): QuotedCritique[] | null {
  if (!Array.isArray(raw) || raw.length !== answers.length) return null;

  const critiques: QuotedCritique[] = [];
  const seen = new Set<number>();
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const row = item as Record<string, unknown>;
    if (typeof row.questionIndex !== "number") return null;
    if (seen.has(row.questionIndex)) return null;
    seen.add(row.questionIndex);
    if (typeof row.quote !== "string") return null;
    if (typeof row.explanation !== "string" || row.explanation.trim() === "") {
      return null;
    }
    if (typeof row.rewrite !== "string" || row.rewrite.trim() === "") {
      return null;
    }
    if (
      typeof row.category !== "string" ||
      !RUBRIC_CATEGORY_KEYS.includes(row.category as RubricCategoryKey)
    ) {
      return null;
    }

    const answer = answers.find((a) => a.questionIndex === row.questionIndex);
    if (!answer) return null;
    const trimmed = answer.transcript.trim();
    if (row.quote === SILENT_QUOTE) {
      if (trimmed !== "") return null;
    } else if (row.quote === "" || !answer.transcript.includes(row.quote)) {
      return null;
    }
    if (row.rewrite === SILENT_QUOTE) return null;
    // A changed rewrite is new coaching text, so it must be Japanese; an
    // unchanged quote keeps the student's own phrase as-is.
    if (row.rewrite !== row.quote && !hasJapaneseKana(row.rewrite)) return null;
    const coaching = `${row.explanation}\n${row.rewrite}`;
    if (
      hasEligibilityClaim(row.explanation) || hasEligibilityClaim(row.rewrite) ||
      (answer.topic === "financialSupport" && FINANCIAL_ELIGIBILITY_CLAIM.test(coaching))
    ) {
      return null;
    }

    critiques.push({
      questionIndex: row.questionIndex,
      quote: row.quote,
      explanation: row.explanation,
      rewrite: row.rewrite,
      category: row.category as RubricCategoryKey,
    });
  }
  return critiques;
}
