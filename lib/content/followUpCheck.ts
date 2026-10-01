import { transcriptPassesPushbackCheck } from "./pushbackCheck";
import type { QuestionTopicKey } from "./questionBank";

export const MAX_FOLLOW_UPS = 3;

function normalizeQuestionText(text: string): string {
  return text.replace(/[\s。、？！?!.,]/g, "");
}

/** True when one question's text contains the other after punctuation is stripped. */
export function isSubstantialRepeat(question: string, other: string): boolean {
  const a = normalizeQuestionText(question);
  const b = normalizeQuestionText(other);
  if (a.length === 0 || b.length === 0) return false;
  return a.includes(b) || b.includes(a);
}

const ANIME_OR_CULTURE_ONLY = /アニメ|anime|文化|culture/i;
const CAREER_OR_STUDY =
  /大学|専門|仕事|エンジニア|IT|就職|進学|university|college|work|job|engineer/i;
const UNIVERSITY = /大学|university|college/i;
const SUBJECT = /情報|工学|経済|看護|料理|subject|major|computer|IT|ビジネス/i;

export function shouldOfferFollowUp({
  transcript,
  topic,
  followUpsUsed,
}: {
  transcript: string;
  topic: QuestionTopicKey | null;
  followUpsUsed: number;
}): boolean {
  if (followUpsUsed >= MAX_FOLLOW_UPS) return false;
  if (topic === null) return false;
  const trimmed = transcript.trim();
  if (!transcriptPassesPushbackCheck(trimmed)) return false;
  if (trimmed.length < 18) return true;
  if (
    topic === "motivationJapan" &&
    ANIME_OR_CULTURE_ONLY.test(trimmed) &&
    !CAREER_OR_STUDY.test(trimmed)
  ) {
    return true;
  }
  if (topic === "futurePlan" && UNIVERSITY.test(trimmed) && !SUBJECT.test(trimmed)) {
    return true;
  }
  if (topic === "financialSupport" && trimmed.length < 28) {
    return true;
  }
  if (topic === "studyPlan" && trimmed.length < 24) {
    return true;
  }
  return false;
}
