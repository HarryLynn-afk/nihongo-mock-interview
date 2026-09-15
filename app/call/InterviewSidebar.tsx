import { buildSidebarView } from "./buildSidebarView";
import type { QuestionPhase } from "./useQuestionFlow";
import type { InterviewQuestion } from "@/lib/content/questions";

const STATUS_LABEL: Record<QuestionPhase, string> = {
  senseiSpeaking: "Sensei speaking",
  studentAnswering: "Student answering",
  done: "Interview complete",
};

export function InterviewSidebar({
  phase,
  answers,
  sessionQuestions,
}: {
  phase: QuestionPhase;
  answers: readonly (
    | { questionIndex: number; status: "answered"; transcript: string }
    | { questionIndex: number; status: "skipped" }
  )[];
  sessionQuestions?: readonly InterviewQuestion[];
}) {
  const view = buildSidebarView({ phase, answers, sessionQuestions });

  return (
    <aside
      data-testid="interview-sidebar"
      className="flex w-full max-w-xs shrink-0 flex-col gap-3 rounded-2xl border border-paper/10 bg-ink/80 p-4 text-paper md:max-w-56"
    >
      <p className="font-medium">
        Question {view.questionNumber} of {view.questionCount}
      </p>
      <p className="text-sm text-paper/70">{STATUS_LABEL[view.status]}</p>
      <ol className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1 text-xs leading-relaxed text-paper/80">
        {view.entries.map((entry, index) => (
          <li key={`${entry.speaker}-${index}`}>
            <p className="text-[10px] font-medium tracking-wide text-paper/50">
              {entry.speaker === "sensei" ? "Tanaka-sensei" : "You"}
            </p>
            <p>{entry.text}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
