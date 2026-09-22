import { useCopy } from "../components/useUiLocale";

export function ScoringUnavailableScreen() {
  const { copy } = useCopy();

  return (
    <section
      data-testid="scoring-unavailable"
      className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-paper/10 bg-ink p-8 text-center text-paper"
    >
      <h1 className="text-xl font-medium">{copy.scoringUnavailable.title}</h1>
      <p className="max-w-md text-sm text-paper/70">
        {copy.scoringUnavailable.body}
      </p>
    </section>
  );
}
