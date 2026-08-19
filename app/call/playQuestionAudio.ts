/**
 * Plays the given question's audio via /api/tts. The client never knows
 * or cares whether the server served live ElevenLabs TTS or the local
 * fallback — playback contract is identical either way.
 *
 * Returns ended (resolves when playback finishes or is stopped) plus stop()
 * so effect cleanup can halt a player (React Strict Mode remount).
 */
export function playQuestionAudio(
  questionId: number,
  AudioImpl: typeof Audio = Audio,
): { ended: Promise<void>; stop: () => void } {
  let settled = false;
  let stopImpl = () => {};

  const ended = new Promise<void>((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const audio = new AudioImpl(`/api/tts?questionId=${questionId}`);
    audio.addEventListener("ended", finish);
    audio.addEventListener("error", finish);
    audio.play().catch(finish);

    stopImpl = () => {
      if (typeof audio.pause === "function") audio.pause();
      audio.src = "";
      finish();
    };
  });

  return {
    ended,
    stop: () => stopImpl(),
  };
}
