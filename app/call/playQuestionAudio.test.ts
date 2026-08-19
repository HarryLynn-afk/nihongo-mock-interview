import { describe, expect, it, vi } from "vitest";
import { playQuestionAudio } from "./playQuestionAudio";

describe("playQuestionAudio", () => {
  it("plays audio from /api/tts?questionId=N (server owns TTS vs. fallback)", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    let capturedSrc = "";
    class FakeAudio {
      src: string;
      constructor(src: string) {
        capturedSrc = src;
        this.src = src;
      }
      play = play;
      pause = vi.fn();
      addEventListener = () => {};
    }

    const playback = playQuestionAudio(2, FakeAudio as unknown as typeof Audio);

    expect(capturedSrc).toBe("/api/tts?questionId=2");
    expect(play).toHaveBeenCalledOnce();
    playback.stop();
    expect(playback.ended).toBeInstanceOf(Promise);
  });
});
