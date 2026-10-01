import { beforeEach, describe, expect, it, vi } from "vitest";

const { lookupJoinLink, cookieValues } = vi.hoisted(() => ({
  lookupJoinLink: vi.fn(),
  cookieValues: {} as Record<string, string>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieValues[name] ? { value: cookieValues[name] } : undefined,
  }),
}));
vi.mock("./lookupJoinLink", () => ({ lookupJoinLink }));

describe("sessionHome", () => {
  beforeEach(() => {
    lookupJoinLink.mockReset();
    for (const key of Object.keys(cookieValues)) delete cookieValues[key];
  });

  it("returns the device's invite link while it is open", async () => {
    cookieValues.nihongo_device_invite = "T1";
    lookupJoinLink.mockResolvedValue({ signupCount: 0, maxSignups: 10 });
    const { sessionHome } = await import("./sessionHome");

    expect(await sessionHome()).toBe("/join?from=T1");
    expect(lookupJoinLink).toHaveBeenCalledWith("T1");
  });

  it("falls back to the normal landing when the invite is full", async () => {
    cookieValues.nihongo_device_invite = "T1";
    lookupJoinLink.mockResolvedValue({ signupCount: 3, maxSignups: 3 });
    const { sessionHome } = await import("./sessionHome");

    expect(await sessionHome()).toBe("/");
  });

  it("does not look anything up without a device invite", async () => {
    const { sessionHome } = await import("./sessionHome");

    expect(await sessionHome()).toBe("/");
    expect(lookupJoinLink).not.toHaveBeenCalled();
  });
});
