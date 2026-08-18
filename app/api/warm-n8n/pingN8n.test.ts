import { describe, expect, it, vi } from "vitest";
import { pingN8n } from "./pingN8n";

describe("pingN8n", () => {
  it("POSTs to the given URL", async () => {
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

    await pingN8n("https://example.com/webhook", fakeFetch);

    expect(fakeFetch).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("never throws even when fetch rejects (safe for fire-and-forget)", async () => {
    const fakeFetch = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(pingN8n("https://example.com/webhook", fakeFetch)).resolves.toBeUndefined();
  });
});
