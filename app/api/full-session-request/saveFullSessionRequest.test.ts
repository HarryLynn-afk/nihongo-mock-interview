import { describe, expect, it, vi } from "vitest";
import { saveFullSessionRequest } from "./saveFullSessionRequest";

describe("saveFullSessionRequest", () => {
  it("rejects an address that is not an email and does not save", async () => {
    const upsert = vi.fn();
    await expect(saveFullSessionRequest("hello", upsert)).resolves.toBe(
      "invalid",
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("saves the trimmed lowercase address", async () => {
    const upsert = vi.fn().mockResolvedValue({ ok: true });
    await expect(
      saveFullSessionRequest("  Ada@Example.com ", upsert),
    ).resolves.toBe("ok");
    expect(upsert).toHaveBeenCalledWith("ada@example.com");
  });

  it("reports unavailable when the save fails", async () => {
    const upsert = vi.fn().mockResolvedValue({ ok: false });
    await expect(
      saveFullSessionRequest("ada@example.com", upsert),
    ).resolves.toBe("unavailable");
  });
});
