/**
 * Plays the committed public/question-N.mp3 clip. Sensei audio is
 * pre-rendered; the client never hits live ElevenLabs at runtime.
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

    const audio = new AudioImpl(`/question-${questionId}.mp3`);
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
