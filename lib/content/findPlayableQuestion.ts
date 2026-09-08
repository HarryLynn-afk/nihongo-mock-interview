import { questions } from "./questions";
import { getBankQuestionById } from "./questionBank";
import type { InterviewQuestion } from "./questions";

export function findPlayableQuestion(id: number): InterviewQuestion | undefined {
  return questions.find((item) => item.id === id) ?? getBankQuestionById(id);
}
