import { describe, expect, it } from "vitest";
import { getRubricDoc } from "./rubric";

describe("getRubricDoc", () => {
  it("matches the checked-in practice-rubric snapshot (docs/rubric-generated.md)", async () => {
    await expect(getRubricDoc()).toMatchFileSnapshot("../../docs/rubric-generated.md");
  });
});
