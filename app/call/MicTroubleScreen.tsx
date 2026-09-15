export function MicTroubleScreen() {
  return (
    <section
      data-testid="mic-trouble-screen"
      className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-paper/10 bg-ink p-8 text-center text-paper"
    >
      <h1 className="text-xl font-medium">We couldn&apos;t hear you</h1>
      <p className="max-w-md text-sm text-paper/70">
        None of your answers were captured this session. Check that your
        microphone is connected and not muted by your browser or operating
        system, then try the interview again.
      </p>
    </section>
  );
}
