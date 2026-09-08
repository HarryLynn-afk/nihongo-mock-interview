import { describe, expect, it, vi } from "vitest";
import {
  MAGIC_LINK_COPY,
  maybeSendMagicLink,
  nextParticipantId,
  normalizeEmail,
} from "./studyAuth";

describe("studyAuth", () => {
  it("sends a magic link only for allowlisted emails, with the same copy either way", async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    const listed = await maybeSendMagicLink({
      email: "  Tester@School.org ",
      allowlisted: true,
      send,
    });
    expect(listed.message).toBe(MAGIC_LINK_COPY);
    expect(send).toHaveBeenCalledWith("tester@school.org");

    send.mockClear();
    const skipped = await maybeSendMagicLink({
      email: "nobody@example.com",
      allowlisted: false,
      send,
    });
    expect(skipped.message).toBe(MAGIC_LINK_COPY);
    expect(send).not.toHaveBeenCalled();
  });

  it("assigns sequential participant ids starting at P001", () => {
    expect(nextParticipantId([])).toBe("P001");
    expect(nextParticipantId(["P001", "P007"])).toBe("P008");
  });

  it("normalizes email for allowlist lookup", () => {
    expect(normalizeEmail("Ada@Example.COM")).toBe("ada@example.com");
  });
});
