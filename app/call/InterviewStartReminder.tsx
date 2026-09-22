import { useCopy } from "../components/useUiLocale";

type InterviewStartReminderProps = {
  secondsLeft: number;
  onSkip: () => void;
};

export function InterviewStartReminder({
  secondsLeft,
  onSkip,
}: InterviewStartReminderProps) {
  const { copy } = useCopy();

  return (
    <div
      data-testid="start-reminder-backdrop"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#e8f8d4]/80 p-6"
    >
      <div
        role="dialog"
        aria-label={copy.reminder.aria}
        className="flex w-full max-w-md flex-col items-center rounded-2xl border border-feather/15 bg-white p-8 text-center text-eel shadow-[0_24px_64px_-20px_rgba(88,204,2,0.28)]"
      >
        <p className="text-sm tracking-wide text-wolf">
          {copy.reminder.eyebrow}
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">
          {copy.reminder.heading}
        </h2>
        <p className="mt-6 font-display text-6xl font-bold tabular-nums text-feather-dark">
          {secondsLeft}s
        </p>
        <button
          type="button"
          onClick={onSkip}
          disabled={secondsLeft <= 0}
          className="mt-10 w-full rounded-full bg-feather px-6 py-3 font-medium text-white shadow-[0_14px_30px_-10px_rgba(88,204,2,0.55)] transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-feather-dark disabled:opacity-60"
        >
          {copy.reminder.skip}
        </button>
      </div>
    </div>
  );
}
