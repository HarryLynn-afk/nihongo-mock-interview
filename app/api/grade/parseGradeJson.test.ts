import { describe, expect, it } from "vitest";
import { parseGradeJson } from "./parseGradeJson";

describe("parseGradeJson", () => {
  it("parses fenced JSON from a think-wrapped reply with trailing prose", () => {
    const text = [
      "<think>weighing the rubric</think>",
      "Here is the result:",
      "```json",
      '{"scores":[{"id":"relevance","level":3}],"critiques":[{"id":"relevance","text":"good"}]}',
      "```",
      "Let me know if you need changes.",
    ].join("\n");

    expect(parseGradeJson(text)).toEqual({
      scores: [{ id: "relevance", level: 3 }],
      critiques: [{ id: "relevance", text: "good" }],
    });
  });

  it("parses plain JSON", () => {
    expect(parseGradeJson('{"scores":[]}')).toEqual({ scores: [] });
  });

  it("returns null when no JSON object parses", () => {
    expect(
      parseGradeJson("<think>only reasoning</think> and no object here"),
    ).toBeNull();
  });
});
