type InterviewLobbyProps = {
  cameraEnabled: boolean;
  micEnabled: boolean;
  cameraBlocked: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onContinue: () => void;
};

export function InterviewLobby({
  cameraEnabled,
  micEnabled,
  cameraBlocked,
  onToggleCamera,
  onToggleMic,
  onContinue,
}: InterviewLobbyProps) {
  return (
    <div
      role="dialog"
      aria-label="Ready to join"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
    >
      <div className="w-full max-w-md rounded-2xl border border-indigo/30 bg-ink px-8 py-8 text-paper">
        <h2 className="text-2xl font-medium">Ready to join</h2>
        <p className="mt-2 text-paper/80">Choose camera and microphone, then continue.</p>

        <div className="mt-6 flex flex-col gap-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={cameraEnabled}
              disabled={cameraBlocked}
              onChange={onToggleCamera}
            />
            Camera
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={micEnabled}
              onChange={onToggleMic}
            />
            Microphone
          </label>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 w-full rounded-full bg-indigo px-6 py-3 font-medium text-paper"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
