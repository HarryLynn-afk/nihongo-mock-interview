/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PITCH_GATE_COOKIE, pitchGateIsOpen } from "@/lib/content/pitchGate";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/pitch/unlock", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV, PITCH_ACCESS_KEY: "oral-exam-demo-key" };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns 401 and no cookie when the key is wrong", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/pitch/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "nope" }),
      }),
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns 401 when the env key is missing", async () => {
    delete process.env.PITCH_ACCESS_KEY;
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/pitch/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "oral-exam-demo-key" }),
      }),
    );

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false });
  });

  it("sets an HttpOnly gate cookie when the key matches", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/pitch/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "oral-exam-demo-key" }),
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${PITCH_GATE_COOKIE}=`);
    expect(setCookie.toLowerCase()).toContain("httponly");
    const token = setCookie.split(";")[0]?.split("=")[1];
    expect(await pitchGateIsOpen(token, "oral-exam-demo-key")).toBe(true);
    expect(setCookie).not.toContain("oral-exam-demo-key");
  });
});
