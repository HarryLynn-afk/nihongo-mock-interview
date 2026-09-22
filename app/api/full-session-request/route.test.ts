import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { upsert, from, createStudyAdminClient } = vi.hoisted(() => {
  const upsert = vi.fn();
  const from = vi.fn();
  return {
    upsert,
    from,
    createStudyAdminClient: vi.fn(),
  };
});

vi.mock("@/lib/server/study/adminClients", () => ({
  createStudyAdminClient,
}));

describe("POST /api/full-session-request", () => {
  beforeEach(() => {
    upsert.mockReset();
    from.mockReset();
    createStudyAdminClient.mockReset();
    from.mockImplementation((table: string) => {
      if (table !== "full_session_requests") {
        throw new Error(`unexpected table ${table}`);
      }
      return { upsert };
    });
  });

  it("returns 503 when Supabase is not configured", async () => {
    createStudyAdminClient.mockReturnValue(null);
    const response = await POST(
      new Request("http://localhost/api/full-session-request", {
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com" }),
      }),
    );
    expect(response.status).toBe(503);
    expect(from).not.toHaveBeenCalled();
  });

  it("upserts the address and does not write the invited list", async () => {
    upsert.mockResolvedValue({ error: null });
    createStudyAdminClient.mockReturnValue({ from });
    const response = await POST(
      new Request("http://localhost/api/full-session-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "  Ada@Example.com " }),
      }),
    );
    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("full_session_requests");
    expect(upsert).toHaveBeenCalledWith(
      { email: "ada@example.com" },
      { onConflict: "email" },
    );
  });

  it("returns 400 for a bad address", async () => {
    createStudyAdminClient.mockReturnValue({ from });
    const response = await POST(
      new Request("http://localhost/api/full-session-request", {
        method: "POST",
        body: JSON.stringify({ email: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});
