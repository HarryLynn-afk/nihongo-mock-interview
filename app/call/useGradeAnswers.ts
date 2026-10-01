import {
  getBankQuestionById,
  type QuestionTopicKey,
} from "@/lib/content/questionBank";
import { questions, type InterviewQuestion } from "@/lib/content/questions";
import type { QuestionPhase, StoredAnswer } from "./useQuestionFlow";

export type GradeAnswer = {
  questionIndex: number;
  questionId: number;
  topic: QuestionTopicKey | null;
  questionJapanese: string;
  transcript: string;
  pushbackCount: 0 | 1 | 2;
};

/** The 3 locked Pitch/guest Questions are not rows in the topic bank. */
const LOCKED_QUESTION_TOPICS: Record<number, QuestionTopicKey> = {
  1: "selfIntroduction",
  2: "motivationJapan",
  3: "studyPlan",
};

export type GradeCollection =
  | { status: "collecting" }
  | { status: "ready"; answers: GradeAnswer[] };

export function useGradeAnswers({
  answers,
  phase,
  sessionQuestions = questions,
}: {
  answers: StoredAnswer[];
  phase: QuestionPhase;
  sessionQuestions?: readonly InterviewQuestion[];
}): GradeCollection {
  if (phase !== "done") {
    return { status: "collecting" };
  }

  const gradeAnswers: GradeAnswer[] = [];
  for (const answer of answers) {
    if (answer.status !== "answered") continue;
    const question =
      sessionQuestions.find((item) => item.id === answer.questionId) ??
      sessionQuestions[answer.questionIndex];
    if (!question) continue;
    gradeAnswers.push({
      questionIndex: answer.questionIndex,
      questionId: question.id,
      topic:
        getBankQuestionById(question.id)?.topic ??
        LOCKED_QUESTION_TOPICS[question.id] ??
        null,
      questionJapanese: question.japanese,
      transcript: answer.transcript,
      pushbackCount: answer.pushbackCount,
    });
  }

  return { status: "ready", answers: gradeAnswers };
}
