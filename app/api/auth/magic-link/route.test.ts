import { describe, expect, it, vi } from "vitest";
import { MAGIC_LINK_COPY } from "@/lib/content/studyAuth";

const ORIGINAL_ENV = { ...process.env };

describe("POST /api/auth/magic-link", () => {
  it("returns the same eligible copy without sending when Supabase is unset", async () => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "anyone@example.com" }),
      }),
    );
    const body = (await res.json()) as { message: string };
    expect(res.status).toBe(200);
    expect(body.message).toBe(MAGIC_LINK_COPY);
    process.env = { ...ORIGINAL_ENV };
  });
});
