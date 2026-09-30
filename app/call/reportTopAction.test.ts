import { describe, expect, it } from "vitest";
import { reportTopAction } from "./reportTopAction";

describe("reportTopAction", () => {
  it("offers Help the study to a signed-in guest when the form is enabled", () => {
    expect(
      reportTopAction({
        signedIn: true,
        sessionKind: "guest",
        hasSessionId: true,
        formEnabled: true,
      }),
    ).toBe("help");
  });

  it("offers the email ask to an anonymous guest", () => {
    expect(
      reportTopAction({
        signedIn: false,
        sessionKind: "guest",
        hasSessionId: true,
        formEnabled: true,
      }),
    ).toBe("request");
  });

  it("offers Help the study to a signed-in participant", () => {
    expect(
      reportTopAction({
        signedIn: true,
        sessionKind: "participant",
        hasSessionId: true,
        formEnabled: true,
      }),
    ).toBe("help");
  });

  it("offers nothing to a participant with no enabled form", () => {
    expect(
      reportTopAction({
        signedIn: true,
        sessionKind: "participant",
        hasSessionId: true,
        formEnabled: false,
      }),
    ).toBeNull();
  });

  it("falls back to the email ask for a signed-in guest when the form is off", () => {
    expect(
      reportTopAction({
        signedIn: true,
        sessionKind: "guest",
        hasSessionId: true,
        formEnabled: false,
      }),
    ).toBe("request");
  });

  it("needs a session id for Help the study but not for the guest email ask", () => {
    expect(
      reportTopAction({
        signedIn: true,
        sessionKind: "guest",
        hasSessionId: false,
        formEnabled: true,
      }),
    ).toBe("request");
    expect(
      reportTopAction({
        signedIn: true,
        sessionKind: "participant",
        hasSessionId: false,
        formEnabled: true,
      }),
    ).toBeNull();
  });
});
