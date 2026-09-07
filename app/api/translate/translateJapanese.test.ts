import { afterEach, describe, expect, it, vi } from "vitest";
import { resetGroqCapacityForTests } from "../groqCapacity";
import { translateJapanese } from "./translateJapanese";

describe("translateJapanese", () => {
  afterEach(() => {
    resetGroqCapacityForTests();
  });

  it("returns English when Groq responds within the timeout", async () => {
    const groqFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Hello, I am Aung Min Khant." } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const english = await translateJapanese({
      japanese: "はじめまして。",
      groqFetch,
      getTranslateKey: () => "test-translate-key",
      timeoutMs: 3000,
    });

    expect(english).toBe("Hello, I am Aung Min Khant.");
    expect(groqFetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-translate-key",
        }),
      }),
    );
  });

  it("returns null without throwing when Groq takes longer than timeoutMs", async () => {
    let capturedSignal: AbortSignal | undefined;
    const groqFetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal ?? undefined;
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );

    const english = await translateJapanese({
      japanese: "はじめまして。",
      groqFetch,
      getTranslateKey: () => "test-translate-key",
      timeoutMs: 50,
    });

    expect(english).toBeNull();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("returns null without throwing when Groq responds with an error", async () => {
    const groqFetch = vi.fn().mockResolvedValue(
      new Response("unavailable", { status: 500 }),
    );

    const english = await translateJapanese({
      japanese: "はじめまして。",
      groqFetch,
      getTranslateKey: () => "test-translate-key",
    });

    expect(english).toBeNull();
  });

  it("returns null on Groq 429 and skips the next translate call", async () => {
    const groqFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("Too Many Requests", { status: 429 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Hello." } }],
          }),
          { status: 200 },
        ),
      );

    const first = await translateJapanese({
      japanese: "はじめまして。",
      groqFetch,
      getTranslateKey: () => "test-translate-key",
    });
    const second = await translateJapanese({
      japanese: "はじめまして。",
      groqFetch,
      getTranslateKey: () => "test-translate-key",
    });

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(groqFetch).toHaveBeenCalledOnce();
  });
});
