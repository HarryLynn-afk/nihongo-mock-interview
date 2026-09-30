import { describe, expect, it } from "vitest";
import config from "./next.config";

describe("security headers", () => {
  it("sets the baseline security headers on every route", async () => {
    const groups = (await config.headers?.()) ?? [];
    const keys = groups[0]?.headers.map((header) => header.key) ?? [];

    expect(groups[0]?.source).toBe("/(.*)");
    expect(keys).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "Referrer-Policy",
        "X-Frame-Options",
        "Strict-Transport-Security",
        "Permissions-Policy",
      ]),
    );
  });

  it("ships a Content-Security-Policy as report-only", async () => {
    const groups = (await config.headers?.()) ?? [];
    const keys = groups[0]?.headers.map((header) => header.key) ?? [];

    expect(keys).toContain("Content-Security-Policy-Report-Only");
    expect(keys).not.toContain("Content-Security-Policy");
  });
});
