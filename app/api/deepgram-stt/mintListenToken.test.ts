import { describe, expect, it, vi } from "vitest";
import {
  DEEPGRAM_GRANT_URL,
  mintDeepgramListenToken,
} from "./mintListenToken";

describe("mintDeepgramListenToken", () => {
  it("POSTs a short-lived grant and returns only the access token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "dg-ephemeral" }),
    });

    const result = await mintDeepgramListenToken({
      apiKey: "dg-never-to-client",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual({ accessToken: "dg-ephemeral" });
    expect(fetchImpl).toHaveBeenCalledWith(
      DEEPGRAM_GRANT_URL,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Token dg-never-to-client",
        }),
      }),
    );
    const body = JSON.parse(
      (fetchImpl.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.ttl_seconds).toBe(300);
  });

  it("returns null when Deepgram misses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "nope" }),
    });

    await expect(
      mintDeepgramListenToken({
        apiKey: "dg-x",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).resolves.toBeNull();
  });

  it("returns null when the grant request rejects", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("network"));

    await expect(
      mintDeepgramListenToken({
        apiKey: "dg-x",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).resolves.toBeNull();
  });

  it("returns null when the grant request stays pending", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );

    await expect(
      mintDeepgramListenToken({
        apiKey: "dg-x",
        fetchImpl: fetchImpl as unknown as typeof fetch,
        timeoutMs: 10,
      }),
    ).resolves.toBeNull();
  });
});
