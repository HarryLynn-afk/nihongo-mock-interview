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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-indigo/30 bg-ink px-8 py-8 text-center text-paper">
        <h2 className="text-2xl font-medium">Interview will start soon</h2>
        <p className="mt-4 text-4xl font-medium tabular-nums">{secondsLeft}s</p>
        <button
          type="button"
          onClick={onSkip}
          className="mt-8 w-full rounded-full bg-indigo px-6 py-3 font-medium text-paper"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
