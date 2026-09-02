import Image from "next/image";

type SpeakAnswerButtonProps = {
  listening: boolean;
  paused?: boolean;
  onClick: () => void;
};

export function SpeakAnswerButton({
  listening,
  paused = false,
  onClick,
}: SpeakAnswerButtonProps) {
  const ariaLabel = paused
    ? "Resume listening"
    : listening
      ? "Pause listening"
      : "Speak answer";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={listening}
      className="relative size-16 shrink-0 rounded-full"
    >
      {listening ? (
        <span
          data-testid="speak-answer-recording"
          aria-hidden="true"
          className="speak-record-pulse relative flex size-full items-center justify-center overflow-clip rounded-full bg-[#e11d48]"
        >
          <span className="flex size-6 overflow-clip">
            <Image
              src="/speak-answer-waveform.svg"
              alt=""
              width={24}
              height={24}
              className="h-full w-full"
            />
          </span>
        </span>
      ) : paused ? (
        <span
          data-testid="speak-answer-paused"
          aria-hidden="true"
          className="relative flex size-full items-center justify-center overflow-clip rounded-full bg-[#d97706]"
        >
          <span className="flex gap-1">
            <span className="h-5 w-1.5 rounded-full bg-paper" />
            <span className="h-5 w-1.5 rounded-full bg-paper" />
          </span>
        </span>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-[-8px] rounded-full bg-indigo/25 opacity-80"
          />
          <span className="relative z-10 flex size-full items-center justify-center overflow-clip rounded-full bg-[#1a1b4f]">
            <span className="flex h-7 w-5 overflow-clip">
              <Image
                data-testid="speak-answer-mic"
                src="/speak-answer-mic.svg"
                alt=""
                width={20}
                height={28}
                className="h-full w-full"
              />
            </span>
          </span>
        </>
      )}
    </button>
  );
}
