import { buildSidebarView } from "./buildSidebarView";
import type { QuestionPhase } from "./useQuestionFlow";

const STATUS_LABEL: Record<QuestionPhase, string> = {
  senseiSpeaking: "Sensei speaking",
  studentAnswering: "Student answering",
  done: "Interview complete",
};

export function InterviewSidebar({
  phase,
  answers,
}: {
  phase: QuestionPhase;
  answers: readonly { questionIndex: number; transcript: string }[];
}) {
  const view = buildSidebarView({ phase, answers });

  return (
    <aside
      data-testid="interview-sidebar"
      className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-indigo/30 bg-ink p-4 text-paper"
    >
      <p className="font-medium">
        Question {view.questionNumber} of {view.questionCount}
      </p>
      <p className="text-sm text-paper/70">{STATUS_LABEL[view.status]}</p>
      <ol className="flex flex-col gap-3 text-sm text-paper/90">
        {view.entries.map((entry, index) => (
          <li key={`${entry.speaker}-${index}`}>{entry.text}</li>
        ))}
      </ol>
    </aside>
  );
}
