import { useCopy } from "../components/useUiLocale";

export function MicTroubleScreen() {
  const { copy } = useCopy();

  return (
    <section
      data-testid="mic-trouble-screen"
      className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-eel/10 bg-white p-8 text-center text-eel"
    >
      <h1 className="text-xl font-medium">{copy.micTrouble.title}</h1>
      <p className="max-w-md text-sm text-eel/85">{copy.micTrouble.body}</p>
    </section>
  );
}
