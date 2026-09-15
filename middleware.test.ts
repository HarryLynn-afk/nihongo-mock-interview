/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PITCH_GATE_COOKIE, signPitchGateToken } from "@/lib/content/pitchGate";

const ORIGINAL_ENV = { ...process.env };

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", `${PITCH_GATE_COOKIE}=${cookie}`);
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("middleware Pitch gate", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      PITCH_ACCESS_KEY: "oral-exam-demo-key",
    };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("redirects /call?pitch=1 to /pitch when the gate cookie is missing", async () => {
    const { middleware } = await import("./middleware");
    const res = await middleware(request("/call?pitch=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/pitch");
  });

  it("lets /call?pitch=1 through when the gate cookie is valid", async () => {
    const token = await signPitchGateToken("oral-exam-demo-key");
    const { middleware } = await import("./middleware");
    const res = await middleware(request("/call?pitch=1", token));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not redirect practice /call or /pitch itself", async () => {
    const { middleware } = await import("./middleware");
    const practice = await middleware(request("/call"));
    const landing = await middleware(request("/pitch"));
    expect(practice.headers.get("location")).toBeNull();
    expect(landing.headers.get("location")).toBeNull();
  });
});
