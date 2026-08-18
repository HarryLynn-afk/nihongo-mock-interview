import { describe, expect, it, vi } from "vitest";
import { getRubricPrompt } from "@/lib/content/rubric";
import { runGeminiGrade } from "./runGeminiGrade";

const SAMPLE_SCORES = {
  speaking: 5,
  listening: 4,
  grammarPoliteness: 4,
  motivation: 5,
  studyPlan: 5,
  consistency: 4,
};

const answers = [
  {
    questionIndex: 0,
    inputMode: "voice" as const,
    transcript: "はじめまして。アウンミンハントです。",
  },
];

describe("runGeminiGrade", () => {
  it("scores Gemini raw 1-5s with gemini-3.6-flash and the grade key", async () => {
    const geminiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      scores: SAMPLE_SCORES,
                      coaching: ["Use です/ます all the way through."],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const report = await runGeminiGrade({
      answers,
      geminiFetch,
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
        profileName: "Aung Min Khant",
        coaching: ["Use です/ます all the way through."],
      }),
    );
    expect(geminiFetch).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-goog-api-key": "test-grade-key",
        }),
      }),
    );
  });

  it("returns null without throwing when Gemini fetch rejects", async () => {
    const geminiFetch = vi.fn().mockRejectedValue(new Error("network down"));

    const report = await runGeminiGrade({
      answers,
      geminiFetch,
      getGradeKey: () => "test-grade-key",
    });

    expect(report).toBeNull();
  });

  it("sends the shared rubric prompt as the Gemini system instruction", async () => {
    const geminiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      scores: SAMPLE_SCORES,
                      coaching: [],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await runGeminiGrade({
      answers,
      geminiFetch,
      getGradeKey: () => "test-grade-key",
    });

    const body = JSON.parse(
      String((geminiFetch.mock.calls[0][1] as RequestInit).body),
    ) as { systemInstruction?: { parts?: Array<{ text?: string }> } };
    expect(body.systemInstruction?.parts?.[0]?.text).toBe(getRubricPrompt());
  });

  it("sends the locked profile and answer transcripts in the user turn", async () => {
    const geminiFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      scores: SAMPLE_SCORES,
                      coaching: [],
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await runGeminiGrade({
      answers,
      geminiFetch,
      getGradeKey: () => "test-grade-key",
    });

    const body = JSON.parse(
      String((geminiFetch.mock.calls[0][1] as RequestInit).body),
    ) as { contents?: Array<{ parts?: Array<{ text?: string }> }> };
    const userText = body.contents?.[0]?.parts?.[0]?.text ?? "";
    expect(userText).toContain("Aung Min Khant");
    expect(userText).toContain("はじめまして。アウンミンハントです。");
    expect(userText).toContain("voice");
  });
});
