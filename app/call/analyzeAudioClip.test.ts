import { describe, expect, it } from "vitest";
import { analyzeAudioClip } from "./analyzeAudioClip";

describe("analyzeAudioClip", () => {
  it("marks an empty clip as unable with empty reason", async () => {
    const result = await analyzeAudioClip(new Blob());

    expect(result.recordingQuality).toBe("unableToAssess");
    expect(result.unableReason).toBe("empty");
  });

  it("does not invent RMS-based coaching for a non-empty clip", async () => {
    const result = await analyzeAudioClip(
      new Blob([new Uint8Array([1, 2, 3, 4])], { type: "audio/webm" }),
    );

    expect(result.recordingQuality).toBe("unableToAssess");
    expect(result.unableReason).toBe("noTimestamps");
    expect(result.tip).toBeNull();
  });
});
