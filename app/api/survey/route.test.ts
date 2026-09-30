/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("GET /api/survey", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.RESEARCH_FORM_URL;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns enabled false when RESEARCH_FORM_URL is missing", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ enabled: false });
  });

  it("returns enabled true when RESEARCH_FORM_URL is set", async () => {
    process.env.RESEARCH_FORM_URL = "https://docs.google.com/forms/d/e/test/formResponse";
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ enabled: true });
  });
});

describe("POST /api/survey", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.RESEARCH_FORM_URL;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("returns 204 and does not POST to Google when the form URL is missing", async () => {
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skipped: true,
        }),
      }),
    );

    expect(res.status).toBe(204);
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("POSTs the payload to the form URL when it is set", async () => {
    process.env.RESEARCH_FORM_URL =
      "https://docs.google.com/forms/d/e/test/formResponse";
    const fakeFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fakeFetch);
    const { POST } = await import("./route");
    const payload = { skipped: true };
    const res = await POST(
      new Request("http://localhost/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(res.status).toBe(202);
    expect(fakeFetch).toHaveBeenCalledWith(
      "https://docs.google.com/forms/d/e/test/formResponse",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
