import { describe, expect, it, vi } from "vitest";
import { playQuestionAudio } from "./playQuestionAudio";

describe("playQuestionAudio", () => {
  it("plays the committed public/question-N.mp3 clip", () => {
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

    expect(capturedSrc).toBe("/question-2.mp3");
    expect(play).toHaveBeenCalledOnce();
    playback.stop();
    expect(playback.ended).toBeInstanceOf(Promise);
  });
});
