import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/stt", () => {
  it("returns 400 when the body has no audio string", async () => {
    const res = await POST(
      new Request("http://localhost/api/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(res.status).toBe(400);
  });
});
