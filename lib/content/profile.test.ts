import { describe, expect, it } from "vitest";
import { DISPLAY_CARD_FIELDS, profile } from "./profile";

const FORBIDDEN_TERMS = [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/];

describe("profile", () => {
  it("has the locked Aung Min Khant fields", () => {
    expect(profile.name).toBe("Aung Min Khant");
    expect(profile.age).toBe(23);
    expect(profile.hometown).toBe("Mandalay, Myanmar");
    expect(profile.education).toBe(
      "B.C.Sc, University of Computer Studies, Mandalay (2025)",
    );
    expect(profile.sponsor).toContain("U Ko Ko Khant");
  });

  it("exposes exactly the 6 fields the read-only start-screen card must show", () => {
    expect(DISPLAY_CARD_FIELDS).toEqual([
      "name",
      "age",
      "hometown",
      "education",
      "plan",
      "sponsor",
    ]);
  });

  it("never contains forbidden exam/verdict terms in any display-card field", () => {
    const displayText = DISPLAY_CARD_FIELDS.map((field) => String(profile[field])).join(" ");

    for (const term of FORBIDDEN_TERMS) {
      expect(displayText).not.toMatch(term);
    }
  });
});
