import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { allPlayableQuestions } from "./findPlayableQuestion";

describe("committed sensei audio", () => {
  it("has a public/question-{id}.mp3 for every playable Question", () => {
    const playable = allPlayableQuestions();
    expect(playable.length).toBeGreaterThan(3);

    const missing = playable
      .map((question) => `question-${question.id}.mp3`)
      .filter(
        (fileName) =>
          !existsSync(path.join(process.cwd(), "public", fileName)),
      );

    expect(missing).toEqual([]);
  });
});
