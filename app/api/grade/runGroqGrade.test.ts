import { describe, expect, it, vi } from "vitest";
import { getRubricPrompt } from "@/lib/content/rubric";
import { runGroqGrade } from "./runGroqGrade";

const SAMPLE_SCORES = {
  speaking: 5,
  listening: 4,
  grammarPoliteness: 4,
  motivation: 5,
  studyPlan: 5,
  consistency: 4,
};

const critiques = [
  {
    questionIndex: 0,
    quote: "はじめまして",
    explanation: "Use です/ます all the way through.",
    rewrite: "はじめまして。アウンミンハントです。",
    category: "speaking" as const,
  },
];

const answers = [
  {
    questionIndex: 0,
    inputMode: "voice" as const,
    transcript: "はじめまして。アウンミンハントです。",
    pushbackCount: 0 as const,
    forced: false,
  },
];

describe("runGroqGrade", () => {
  it("scores Groq raw 1-5s with qwen/qwen3.6-27b and the grade key", async () => {
    const groqFetch = vi.fn().mockResolvedValue(
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

    const report = await runGroqGrade({
      answers,
      groqFetch,
      getGradeKey: () => "test-grade-key",
    });

    expect(report).toEqual(
      expect.objectContaining({
        headline: "Ready",
        stamp: "準備OK",
        total: 92,
        gatesFired: [],
        source: "grade",
        banner: null,
        profileName: "",
        critiques,
      }),
    );
    expect(groqFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-grade-key",
        }),
      }),
    );
    const body = JSON.parse(
      String((groqFetch.mock.calls[0][1] as RequestInit).body),
    ) as {
      model?: string;
      reasoning_effort?: string;
      response_format?: { type?: string };
    };
    expect(body.model).toBe("qwen/qwen3.6-27b");
    expect(body.reasoning_effort).toBe("none");
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("scores Groq JSON even when the model wraps it in markdown or think tags", async () => {
    const payload = JSON.stringify({ scores: SAMPLE_SCORES, critiques });
    const groqFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `<think>plan the rubric</think>\n\`\`\`json\n${payload}\n\`\`\``,
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const report = await runGroqGrade({
      answers,
      groqFetch,
      getGradeKey: () => "test-grade-key",
    });

    expect(report).toEqual(
      expect.objectContaining({
        headline: "Ready",
        source: "grade",
        critiques,
      }),
    );
  });

  it("returns null without throwing when Groq fetch rejects", async () => {
    const groqFetch = vi.fn().mockRejectedValue(new Error("network down"));

    const report = await runGroqGrade({
      answers,
      groqFetch,
      getGradeKey: () => "test-grade-key",
    });

    expect(report).toBeNull();
  });

  it("sends the shared rubric prompt as the Groq system message", async () => {
    const groqFetch = vi.fn().mockResolvedValue(
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
        { status: 200 },
      ),
    );

    await runGroqGrade({
      answers,
      groqFetch,
      getGradeKey: () => "test-grade-key",
    });

    const body = JSON.parse(
      String((groqFetch.mock.calls[0][1] as RequestInit).body),
    ) as { messages?: Array<{ role?: string; content?: string }> };
    expect(body.messages?.[0]).toEqual({
      role: "system",
      content: getRubricPrompt(),
    });
  });

  it("sends answer transcripts in the user message and no locked student card", async () => {
    const groqFetch = vi.fn().mockResolvedValue(
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
        { status: 200 },
      ),
    );

    await runGroqGrade({
      answers,
      groqFetch,
      getGradeKey: () => "test-grade-key",
    });

    const body = JSON.parse(
      String((groqFetch.mock.calls[0][1] as RequestInit).body),
    ) as { messages?: Array<{ role?: string; content?: string }> };
    const userText = body.messages?.[1]?.content ?? "";
    expect(body.messages?.[1]?.role).toBe("user");
    expect(userText).not.toContain("Aung Min Khant");
    expect(userText).toContain("はじめまして。アウンミンハントです。");
    expect(userText).toContain("voice");
  });
});
