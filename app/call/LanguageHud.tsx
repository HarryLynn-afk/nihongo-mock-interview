type LanguageHudProps = {
  speaker: "sensei" | "student";
  caption: string | null;
  liveCaption?: string | null;
  english?: string | null;
  burmese?: string | null;
};

export function LanguageHud({
  speaker,
  caption,
  liveCaption,
  english,
  burmese,
}: LanguageHudProps) {
  const waveformClass = speaker === "student" ? "bg-indigo" : "bg-paper/60";

  return (
    <div
      data-testid="language-hud"
      data-speaker={speaker}
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-1 bg-gradient-to-t from-ink via-ink/85 to-transparent px-4 pb-4 pt-12 text-paper"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-paper/60">
        Question
      </p>
      <div
        data-testid="waveform"
        aria-hidden="true"
        className={`h-1.5 w-24 rounded-full ${waveformClass}`}
      />
      {caption ? (
        <p className="text-center text-xl font-medium leading-snug text-paper md:text-2xl">
          {caption}
        </p>
      ) : null}
      {liveCaption ? (
        <p className="text-center text-base font-medium leading-snug text-paper/90">
          {liveCaption}
        </p>
      ) : null}
      {english ? (
        <p className="text-center text-sm text-paper/80">{english}</p>
      ) : null}
      {burmese ? (
        <p className="text-center text-sm text-paper/80">{burmese}</p>
      ) : null}
    </div>
  );
}
