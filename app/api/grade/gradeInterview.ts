import type { InterviewReport } from "./runGroqGrade";

type GradeAttempt = () => Promise<InterviewReport | null>;

export async function gradeInterview({
  primary,
  secondary,
}: {
  primary: GradeAttempt;
  secondary: GradeAttempt;
}): Promise<InterviewReport | null> {
  return (await primary()) ?? (await secondary());
}
