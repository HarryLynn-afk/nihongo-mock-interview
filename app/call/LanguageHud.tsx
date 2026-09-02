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
      className="flex w-full max-w-3xl flex-col items-center gap-2 rounded-xl border border-paper/10 bg-ink/80 px-6 py-4 text-paper md:px-8"
    >
      <p className="text-xs font-medium tracking-[0.18em] text-paper/60">
        Question
      </p>
      <div
        data-testid="waveform"
        aria-hidden="true"
        className={`h-1.5 w-32 rounded-full ${waveformClass}`}
      />
      {caption ? (
        <p className="text-center text-4xl font-medium leading-snug text-paper">
          {caption}
        </p>
      ) : null}
      {liveCaption ? (
        <p className="text-center text-2xl font-medium leading-snug text-paper/90">
          {liveCaption}
        </p>
      ) : null}
      {english ? (
        <p className="text-center text-lg text-paper/80">{english}</p>
      ) : null}
      {burmese ? (
        <p className="text-center text-lg text-paper/80">{burmese}</p>
      ) : null}
    </div>
  );
}
