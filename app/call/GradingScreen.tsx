import { useCopy } from "../components/useUiLocale";

/** Shown on `/call` from interview end until the score request returns. */
export function GradingScreen() {
  const { copy } = useCopy();

  return (
    <section
      data-testid="grading-screen"
      role="status"
      aria-live="polite"
      className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-eel/10 bg-white p-8 text-center text-eel"
    >
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-[3px] border-eel/15 border-t-feather"
      />
      <h1 className="text-xl font-medium">{copy.grading.title}</h1>
      <p className="max-w-md text-sm text-eel/85">{copy.grading.body}</p>
    </section>
  );
}
