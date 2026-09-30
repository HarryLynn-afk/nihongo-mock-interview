import { useCopy } from "../components/useUiLocale";

type LanguageHudProps = {
  speaker: "sensei" | "student";
  caption: string | null;
  liveCaption?: string | null;
  english?: string | null;
  burmese?: string | null;
  onHearAgain?: () => void;
  hearAgainPlaying?: boolean;
};

export function LanguageHud({
  speaker,
  caption,
  liveCaption,
  english,
  burmese,
  onHearAgain,
  hearAgainPlaying = false,
}: LanguageHudProps) {
  const { copy } = useCopy();
  const waveformClass = speaker === "student" ? "bg-feather" : "bg-eel/40";

  return (
    <div
      data-testid="language-hud"
      data-speaker={speaker}
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-1 bg-gradient-to-t from-[#e8f8d4] via-[#e8f8d4]/85 to-transparent px-4 pb-4 pt-12 text-eel"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-eel/60">
        {copy.call.question}
      </p>
      <div
        data-testid="waveform"
        aria-hidden="true"
        className={`h-1.5 w-24 rounded-full ${waveformClass}`}
      />
      <div className="relative w-full max-w-xl">
        {onHearAgain ? (
          <button
            type="button"
            onClick={onHearAgain}
            aria-label={hearAgainPlaying ? copy.call.stopHearing : copy.call.hearAgain}
            className="absolute -left-1 top-0 flex size-9 items-center justify-center rounded-full text-eel/80 transition-colors hover:bg-eel/10 hover:text-eel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eel md:-left-10"
          >
            {hearAgainPlaying ? (
              <span className="size-2.5 rounded-sm bg-eel" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
              </svg>
            )}
          </button>
        ) : null}
        {caption ? (
          <p className="text-center text-xl font-medium leading-snug text-eel md:text-2xl">
            {caption}
          </p>
        ) : null}
        {english ? (
          <p className="mt-1 text-center text-sm text-eel/80">{english}</p>
        ) : null}
        {burmese ? (
          <p className="mt-1 text-center text-sm text-eel/80">{burmese}</p>
        ) : null}
      </div>
      {liveCaption ? (
        <p className="text-center text-base font-medium leading-snug text-eel/90">
          {liveCaption}
        </p>
      ) : null}
    </div>
  );
}
