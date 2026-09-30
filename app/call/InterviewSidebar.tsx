import { buildSidebarView } from "./buildSidebarView";
import type { QuestionPhase } from "./useQuestionFlow";
import type { InterviewQuestion } from "@/lib/content/questions";
import { fillTemplate } from "@/lib/content/uiCopy";
import { useCopy } from "../components/useUiLocale";

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
  const { locale, copy } = useCopy();
  const view = buildSidebarView({
    phase,
    answers,
    sessionQuestions,
    locale,
  });
  const statusLabel =
    view.status === "senseiSpeaking"
      ? copy.call.senseiSpeaking
      : view.status === "studentAnswering"
        ? copy.call.studentAnswering
        : copy.call.interviewComplete;

  return (
    <aside
      data-testid="interview-sidebar"
      className="flex max-h-40 w-full max-w-xs min-h-0 shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-eel/10 bg-white/80 p-4 text-eel md:h-full md:max-h-none md:max-w-52"
    >
      <p className="font-medium">
        {fillTemplate(copy.call.questionOf, {
          n: view.questionNumber,
          total: view.questionCount,
        })}
      </p>
      <p className="text-sm text-eel/85">{statusLabel}</p>
      <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 text-xs leading-relaxed text-eel/90">
        {view.entries.map((entry, index) => (
          <li key={`${entry.speaker}-${index}`}>
            <p className="text-[10px] font-medium tracking-wide text-eel/75">
              {entry.speaker === "sensei" ? "Tanaka-sensei" : copy.call.you}
            </p>
            <p>{entry.text}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
