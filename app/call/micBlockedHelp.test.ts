import { describe, expect, it } from "vitest";
import {
  cameraTroubleCopy,
  classifyDeviceError,
  detectBrowserFamily,
  insecurePageCopy,
  micBlockedHelpCopy,
  micTroubleCopy,
} from "./micBlockedHelp";

describe("micBlockedHelp", () => {
  it("detects Safari, Chrome, and Firefox from the user agent", () => {
    expect(
      detectBrowserFamily(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      ),
    ).toBe("safari");
    expect(
      detectBrowserFamily(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBe("chrome");
    expect(
      detectBrowserFamily(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
      ),
    ).toBe("firefox");
  });

  it("gives Safari steps that do not mention Chrome settings", () => {
    const copy = micBlockedHelpCopy("safari");
    expect(copy.title).toBe("Microphone is blocked");
    expect(copy.steps).toMatch(/Websites/i);
    expect(copy.steps).toMatch(/Microphone/i);
    expect(copy.steps).not.toMatch(/chrome:\/\//i);
  });

  it("gives Chrome and Firefox their own unblock steps", () => {
    expect(micBlockedHelpCopy("chrome").steps).toMatch(/lock icon/i);
    expect(micBlockedHelpCopy("firefox").steps).toMatch(/lock icon/i);
    expect(micBlockedHelpCopy("firefox").steps).toMatch(/Permissions/i);
  });

  it("tells a blocked camera apart from a busy or missing one", () => {
    expect(classifyDeviceError("NotAllowedError")).toBe("blocked");
    expect(classifyDeviceError("SecurityError")).toBe("blocked");
    expect(classifyDeviceError("NotReadableError")).toBe("in-use");
    expect(classifyDeviceError("TrackStartError")).toBe("in-use");
    expect(classifyDeviceError("AbortError")).toBe("in-use");
    expect(classifyDeviceError("NotFoundError")).toBe("missing");
    expect(classifyDeviceError("OverconstrainedError")).toBe("missing");
    expect(classifyDeviceError("SomethingElseError")).toBe("unknown");
  });

  it("explains a blocked camera with browser and Mac settings steps", () => {
    const copy = cameraTroubleCopy("blocked", "safari");
    expect(copy.title).toBe("Camera is blocked");
    expect(copy.steps).toMatch(/Websites/i);
    expect(copy.steps).toMatch(/Camera/i);
    expect(copy.steps).toMatch(/Privacy & Security/i);
    expect(cameraTroubleCopy("blocked", "chrome").steps).toMatch(/lock icon/i);
  });

  it("explains a camera another app is already using", () => {
    const copy = cameraTroubleCopy("in-use", "safari");
    expect(copy.title).toBe("Camera is busy");
    expect(copy.steps).toMatch(/another app/i);
    expect(copy.steps).not.toMatch(/Websites/i);
  });

  it("explains a missing camera without blaming permission", () => {
    const copy = cameraTroubleCopy("missing", "safari");
    expect(copy.title).toBe("Camera isn't available");
    expect(copy.steps).toMatch(/continue with voice/i);
    expect(copy.steps).not.toMatch(/Allow/i);
    expect(copy.steps).not.toMatch(/Overconstrained/i);
  });

  it("names a closed MacBook lid for a busy camera", () => {
    expect(cameraTroubleCopy("in-use", "safari").steps).toMatch(
      /lid is closed/i,
    );
  });

  it("explains that an IP address page cannot use the camera", () => {
    expect(classifyDeviceError("NotSupportedError")).toBe("insecure");
    const copy = cameraTroubleCopy("insecure", "safari");
    expect(copy.title).toBe("This page cannot use the camera");
    expect(copy.steps).toMatch(/localhost:3000/);
    expect(copy.steps).toMatch(/https/i);
  });

  it("covers both devices when the page itself cannot use them", () => {
    const copy = insecurePageCopy();
    expect(copy.title).toMatch(/camera or microphone/i);
    expect(copy.steps).toMatch(/localhost:3000/);
  });

  it("still gives next steps when the camera error is unknown", () => {
    const copy = cameraTroubleCopy("unknown", "other");
    expect(copy.title).toBe("Camera isn't available");
    expect(copy.steps.length).toBeGreaterThan(0);
  });

  it("explains a blocked microphone with browser unlock steps", () => {
    const copy = micTroubleCopy("blocked", "chrome");
    expect(copy.title).toBe("Microphone is blocked");
    expect(copy.steps).toMatch(/lock icon/i);
  });

  it("explains that an IP address page cannot use the microphone", () => {
    const copy = micTroubleCopy("insecure", "chrome");
    expect(copy.title).toMatch(/camera or microphone/i);
    expect(copy.steps).toMatch(/localhost:3000/);
  });

  it("explains a microphone another app is already using", () => {
    const copy = micTroubleCopy("in-use", "chrome");
    expect(copy.title).toBe("Microphone is busy");
    expect(copy.steps).toMatch(/another app|another tab/i);
    expect(copy.steps).not.toMatch(/lock icon/i);
  });

  it("explains a missing microphone without blaming permission", () => {
    const copy = micTroubleCopy("missing", "chrome");
    expect(copy.title).toBe("No microphone found");
    expect(copy.steps).toMatch(/microphone/i);
    expect(copy.steps).not.toMatch(/lock icon/i);
  });
});
