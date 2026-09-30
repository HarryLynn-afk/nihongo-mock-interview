import type { WordTiming } from "./deliveryCoaching";
import {
  formatQuestionDeliveryLabel,
  MID_ANSWER_GAP_SEC,
  topicForDeliveryQuestion,
  tryNextForTopic,
} from "./deliveryCoaching";

export type DeliveryStatus =
  | "unavailable"
  | "unableToAssess"
  | "noIssue"
  | "review";

export type UnableReason = "empty" | "noTimestamps";

export type DeliveryTip = {
  questionIndex: number;
  questionLabel: string;
  evidence: string;
  tryNext: string;
  gapSec: number;
};

export type AnalyzedClip = {
  /** pass = timestamps were usable; unableToAssess = no coaching tip allowed. */
  recordingQuality: "pass" | "unableToAssess";
  tip: DeliveryTip | null;
  unableReason?: UnableReason;
  observations: string[];
};

export type DeliveryAnswer = AnalyzedClip & {
  questionIndex: number;
};

export type SessionDelivery = {
  status: DeliveryStatus;
  headline: string;
  note: string;
  tipCount: number;
  tips: DeliveryTip[];
  answers: DeliveryAnswer[];
};

export const DELIVERY_SECTION_TITLE = "Speech Delivery";
export const ANSWER_QUALITY_TITLE = "Interview Answer Quality";

const UNABLE_OBS: Record<UnableReason, string> = {
  empty: "No audio was saved for this answer.",
  noTimestamps:
    "Word timing was unavailable, so pause coaching could not run for this answer.",
};

export const DELIVERY_HEADLINE: Record<DeliveryStatus, string> = {
  unavailable: "Unable to assess",
  unableToAssess: "Unable to assess",
  noIssue: "No notable issue detected",
  review: "Review points",
};

export const DELIVERY_NOTE: Record<DeliveryStatus, string> = {
  unavailable: "No spoken answer was captured to analyze.",
  unableToAssess:
    "Reliable word timing was not available for pause coaching.",
  noIssue:
    "No clear mid-answer pause was detected from word timing.",
  review:
    "Each tip below pairs measured timing evidence with a short practice suggestion.",
};

export function unableClip(reason: UnableReason = "noTimestamps"): AnalyzedClip {
  return {
    recordingQuality: "unableToAssess",
    tip: null,
    unableReason: reason,
    observations: [UNABLE_OBS[reason]],
  };
}

export function midAnswerGaps(
  words: readonly WordTiming[],
  minGapSec = MID_ANSWER_GAP_SEC,
): number[] {
  if (words.length < 2) return [];
  const gaps: number[] = [];
  for (let index = 1; index < words.length; index += 1) {
    const previous = words[index - 1];
    const current = words[index];
    if (!previous || !current) continue;
    const gap = current.start - previous.end;
    if (gap >= minGapSec) gaps.push(gap);
  }
  return gaps;
}

export function longestMidAnswerGap(
  words: readonly WordTiming[],
  minGapSec = MID_ANSWER_GAP_SEC,
): number | null {
  const gaps = midAnswerGaps(words, minGapSec);
  if (gaps.length === 0) return null;
  return Math.max(...gaps);
}

function formatGapSec(gapSec: number): string {
  return (Math.round(gapSec * 10) / 10).toFixed(1).replace(/\.0$/, ".0");
}

export function analyzeWordTimings({
  words,
  questionIndex,
  questionId,
}: {
  words: readonly WordTiming[] | undefined;
  questionIndex: number;
  questionId?: number;
}): AnalyzedClip {
  if (!words || words.length < 2) {
    return unableClip("noTimestamps");
  }

  const gapSec = longestMidAnswerGap(words);
  if (gapSec === null) {
    return {
      recordingQuality: "pass",
      tip: null,
      observations: ["No clear mid-answer pause was detected."],
    };
  }

  const topic = topicForDeliveryQuestion(questionId);
  const rounded = Math.round(gapSec * 10) / 10;
  const tip: DeliveryTip = {
    questionIndex,
    questionLabel: formatQuestionDeliveryLabel(questionIndex, topic),
    evidence: `A ${formatGapSec(rounded)}-second pause occurred mid-answer.`,
    tryNext: tryNextForTopic(topic),
    gapSec: rounded,
  };

  return {
    recordingQuality: "pass",
    tip,
    observations: [tip.evidence, `Try next: ${tip.tryNext}`],
  };
}

export function summarizeDelivery(
  items: readonly {
    questionIndex: number;
    questionId?: number;
    words?: readonly WordTiming[];
    signal?: AnalyzedClip | null;
  }[],
): SessionDelivery {
  if (items.length === 0) {
    return {
      status: "unavailable",
      headline: DELIVERY_HEADLINE.unavailable,
      note: DELIVERY_NOTE.unavailable,
      tipCount: 0,
      tips: [],
      answers: [],
    };
  }

  const answers: DeliveryAnswer[] = items.map((item) => {
    const signal =
      item.signal ??
      analyzeWordTimings({
        words: item.words,
        questionIndex: item.questionIndex,
        questionId: item.questionId,
      });
    return {
      questionIndex: item.questionIndex,
      ...signal,
    };
  });

  const tips = answers
    .map((answer) => answer.tip)
    .filter((tip): tip is DeliveryTip => tip !== null);

  const anyAssessable = answers.some(
    (answer) => answer.recordingQuality === "pass",
  );

  if (!anyAssessable) {
    return {
      status: "unableToAssess",
      headline: DELIVERY_HEADLINE.unableToAssess,
      note: DELIVERY_NOTE.unableToAssess,
      tipCount: 0,
      tips: [],
      answers,
    };
  }

  if (tips.length === 0) {
    return {
      status: "noIssue",
      headline: DELIVERY_HEADLINE.noIssue,
      note: DELIVERY_NOTE.noIssue,
      tipCount: 0,
      tips: [],
      answers,
    };
  }

  return {
    status: "review",
    headline: DELIVERY_HEADLINE.review,
    note: DELIVERY_NOTE.review,
    tipCount: tips.length,
    tips,
    answers,
  };
}
