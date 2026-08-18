/**
 * Plays the given question's audio via /api/tts. The client never knows
 * or cares whether the server served live ElevenLabs TTS or the local
 * fallback — playback contract is identical either way.
 *
 * Returns a promise that resolves when playback ends (or errors —
 * playback errors are non-fatal, the flow still advances).
 */
export function playQuestionAudio(
  questionId: number,
  AudioImpl: typeof Audio = Audio,
): Promise<void> {
  return new Promise((resolve) => {
    const audio = new AudioImpl(`/api/tts?questionId=${questionId}`);
    audio.addEventListener("ended", () => resolve());
    audio.addEventListener("error", () => resolve());
    audio.play().catch(() => resolve());
  });
}
