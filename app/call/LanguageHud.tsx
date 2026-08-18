type LanguageHudProps = {
  speaker: "sensei" | "student";
  caption: string | null;
  liveCaption?: string | null;
  english?: string | null;
};

export function LanguageHud({
  speaker,
  caption,
  liveCaption,
  english,
}: LanguageHudProps) {
  const waveformClass = speaker === "student" ? "bg-indigo" : "bg-paper/60";

  return (
    <div
      data-testid="language-hud"
      data-speaker={speaker}
      className="flex w-full max-w-4xl flex-col items-center gap-4 rounded-2xl bg-ink px-8 py-5"
    >
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
    </div>
  );
}
