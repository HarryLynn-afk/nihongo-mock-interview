import Image from "next/image";

type SpeakAnswerButtonProps = {
  listening: boolean;
  onClick: () => void;
};

export function SpeakAnswerButton({ listening, onClick }: SpeakAnswerButtonProps) {
  return (
    <button
      type="button"
      onClick={listening ? undefined : onClick}
      aria-label="Speak answer"
      aria-pressed={listening}
      className="relative size-[72px] shrink-0 rounded-full"
    >
      {listening ? (
        <span
          data-testid="speak-answer-glow"
          aria-hidden="true"
          className="speak-answer-glow pointer-events-none absolute -inset-[18px]"
        >
          <span className="speak-blob speak-blob-a" />
          <span className="speak-blob speak-blob-b" />
          <span className="speak-blob speak-blob-c" />
        </span>
      ) : null}
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
    </button>
  );
}
