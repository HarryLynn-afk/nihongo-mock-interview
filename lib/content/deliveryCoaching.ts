import {
  TOPIC_NAV_LABEL,
  getBankQuestionById,
  type QuestionTopicKey,
} from "./questionBank";

export type WordTiming = {
  word: string;
  start: number;
  end: number;
};

/**
 * Mid-answer gap threshold for coaching tips.
 * Product heuristic for practice feedback — not a validated fluency grade.
 */
export const MID_ANSWER_GAP_SEC = 2;

/** Guest locked Questions (ids 1–3) → topic for Try-next templates. */
const GUEST_QUESTION_TOPIC: Record<number, QuestionTopicKey> = {
  1: "selfIntroduction",
  2: "motivationJapan",
  3: "futurePlan",
};

export const DELIVERY_TRY_NEXT: Record<QuestionTopicKey, string> = {
  selfIntroduction:
    "Practise your self-introduction in two short sentences.",
  japaneseStudyHistory:
    "Practise describing your Japanese study history in two short sentences.",
  motivationJapan:
    "Practise explaining your motivation in two short sentences.",
  schoolChoice:
    "Practise explaining why you chose this school in two short sentences.",
  studyPlan: "Practise outlining your study plan in two short sentences.",
  futurePlan:
    "Practise explaining your plans after graduation in two short sentences.",
  financialSupport:
    "Practise explaining your financial support in two short sentences.",
  educationWork:
    "Practise summarizing your education or work background in two short sentences.",
  japaneseLevel:
    "Practise describing your Japanese level in two short sentences.",
  lifeInJapan:
    "Practise describing your life-in-Japan plans in two short sentences.",
};

export function topicForDeliveryQuestion(
  questionId: number | undefined,
): QuestionTopicKey {
  if (questionId !== undefined) {
    const bank = getBankQuestionById(questionId);
    if (bank) return bank.topic;
    const guest = GUEST_QUESTION_TOPIC[questionId];
    if (guest) return guest;
  }
  return "selfIntroduction";
}

export function topicLabelForDelivery(topic: QuestionTopicKey): string {
  return TOPIC_NAV_LABEL[topic];
}

export function tryNextForTopic(topic: QuestionTopicKey): string {
  return DELIVERY_TRY_NEXT[topic];
}

export function formatQuestionDeliveryLabel(
  questionIndex: number,
  topic: QuestionTopicKey,
): string {
  return `Q${questionIndex + 1} · ${topicLabelForDelivery(topic)}`;
}
