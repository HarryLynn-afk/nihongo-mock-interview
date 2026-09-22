import { questions } from "./questions";
import {
  followUpBank,
  getBankQuestionById,
  questionBank,
} from "./questionBank";
import type { InterviewQuestion } from "./questions";

export function findPlayableQuestion(id: number): InterviewQuestion | undefined {
  return questions.find((item) => item.id === id) ?? getBankQuestionById(id);
}

/** Unique locked, bank, and follow-up rows that need a committed sensei clip. */
export function allPlayableQuestions(): InterviewQuestion[] {
  const byId = new Map<number, InterviewQuestion>();
  for (const question of [...questions, ...questionBank, ...followUpBank]) {
    byId.set(question.id, question);
  }
  return [...byId.values()].sort((a, b) => a.id - b.id);
}
