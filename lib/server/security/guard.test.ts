import { beforeEach, describe, expect, it } from "vitest";
import { __resetGuard, withApiGuard } from "./guard";

function post(headers: Record<string, string>) {
  return new Request("http://localhost/api/x", { method: "POST", headers });
}

const ok = () => new Response("ok", { status: 200 });

beforeEach(() => {
  __resetGuard();
});

describe("withApiGuard", () => {
  it("blocks a cross-origin POST with 403", async () => {
    const guarded = withApiGuard(ok, "expensive");

    const res = await guarded(
      post({ origin: "http://evil.example", "x-forwarded-for": "1.1.1.1" }),
    );

    expect(res.status).toBe(403);
  });

  it("passes a same-origin request through to the handler", async () => {
    const guarded = withApiGuard(ok, "expensive");

    const res = await guarded(
      post({ origin: "http://localhost", "x-forwarded-for": "2.2.2.2" }),
    );

    expect(res.status).toBe(200);
  });

  it("returns 429 once one IP exceeds the window limit", async () => {
    const guarded = withApiGuard(ok, "auth");
    const ip = { origin: "http://localhost", "x-forwarded-for": "3.3.3.3" };

    let last = 0;
    for (let call = 0; call < 9; call += 1) {
      last = (await guarded(post(ip))).status;
    }

    expect(last).toBe(429);
  });
});
