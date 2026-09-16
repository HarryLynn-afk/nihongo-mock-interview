type InterviewStartReminderProps = {
  secondsLeft: number;
  onSkip: () => void;
};

export function InterviewStartReminder({
  secondsLeft,
  onSkip,
}: InterviewStartReminderProps) {
  return (
    <div
      role="dialog"
      aria-label="Interview will start soon"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink p-6 text-paper"
    >
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <p className="text-sm tracking-wide text-paper/60">
          Japanese interview with Tanaka-sensei
        </p>
        <h2 className="mt-3 text-2xl font-medium">Interview will start soon</h2>
        <p className="mt-6 text-6xl font-medium tabular-nums">{secondsLeft}s</p>
        <button
          type="button"
          onClick={onSkip}
          disabled={secondsLeft <= 0}
          className="mt-10 w-full rounded-full bg-indigo px-6 py-3 font-medium text-paper disabled:opacity-60"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
