import { afterEach, describe, expect, it, vi } from "vitest";
import { getRubricPrompt } from "@/lib/content/rubric";
import { runDeepseekGrade } from "./runDeepseekGrade";

const SAMPLE_SCORES = {
  answerRelevance: 4,
  contentCompleteness: 3,
  japaneseClarity: 4,
  grammarPoliteness: 3,
  consistency: 3,
};

const critiques = [
  {
    questionIndex: 0,
    quote: "はじめまして",
    explanation: "Use です/ます all the way through.",
    rewrite: "はじめまして。アウンミンハントです。",
    category: "japaneseClarity" as const,
  },
];

const answers = [
  {
    questionIndex: 0,
    transcript: "はじめまして。アウンミンハントです。",
    pushbackCount: 0 as const,
  },
];

describe("runDeepseekGrade", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scores DeepSeek Flash with thinking disabled and the grade key", async () => {
    const deepseekFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  scores: SAMPLE_SCORES,
                  critiques,
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const report = await runDeepseekGrade({
      answers,
      deepseekFetch,
      getGradeKey: () => "test-deepseek-key",
    });

    expect(report).toEqual(
      expect.objectContaining({
        total: 86,
        source: "grade",
        banner: null,
        profileName: "",
        critiques,
      }),
    );
    expect(deepseekFetch).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-deepseek-key",
        }),
      }),
    );
    const body = JSON.parse(
      String((deepseekFetch.mock.calls[0][1] as RequestInit).body),
    ) as {
      model?: string;
      thinking?: { type?: string };
      response_format?: { type?: string };
      messages?: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe("deepseek-flash");
    expect(body.thinking).toEqual({ type: "disabled" });
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages?.[0]).toEqual({
      role: "system",
      content: getRubricPrompt(),
    });
  });

  it("returns null without fetching when the grade key is missing", async () => {
    const deepseekFetch = vi.fn();

    const report = await runDeepseekGrade({
      answers,
      deepseekFetch,
      getGradeKey: () => null,
    });

    expect(report).toBeNull();
    expect(deepseekFetch).not.toHaveBeenCalled();
  });
});
