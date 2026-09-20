export type BrowserFamily = "safari" | "chrome" | "firefox" | "other";

export function detectBrowserFamily(
  userAgent: string | undefined,
): BrowserFamily {
  const ua = (userAgent ?? "").toLowerCase();
  if (ua.includes("firefox") || ua.includes("fxios")) return "firefox";
  if (ua.includes("edg/") || ua.includes("edgios")) return "chrome";
  if (ua.includes("chrome") || ua.includes("crios") || ua.includes("chromium")) {
    return "chrome";
  }
  if (ua.includes("safari")) return "safari";
  return "other";
}

export function micBlockedHelpCopy(family: BrowserFamily): {
  title: string;
  steps: string;
  after: string;
} {
  const title = "Microphone is blocked";
  const after =
    "After you change it, come back to this tab. We will check again.";
  if (family === "safari") {
    return {
      title,
      steps:
        "Safari menu → Settings… → Websites → Microphone. Set localhost to Allow (or Ask). Also check Mac System Settings → Privacy & Security → Microphone and make sure Safari is on. Then reload this page.",
      after,
    };
  }
  if (family === "firefox") {
    return {
      title,
      steps:
        "Click the lock icon next to the website address → Connection secure → More information → Permissions → Use the Microphone → Allow, then reload this page.",
      after,
    };
  }
  if (family === "chrome") {
    return {
      title,
      steps:
        "Click the lock icon next to the website address → Site settings → Microphone → Allow, then reload this page.",
      after,
    };
  }
  return {
    title,
    steps:
      "Open this site’s settings in your browser, set Microphone to Allow, then reload this page.",
    after,
  };
}

export type DeviceErrorKind =
  | "blocked"
  | "in-use"
  | "missing"
  | "insecure"
  | "unknown";

/** getUserMedia rejects with a DOMException name; group those by what to do. */
export function classifyDeviceError(name: string): DeviceErrorKind {
  if (name === "NotSupportedError") return "insecure";
  if (name === "NotAllowedError" || name === "SecurityError") return "blocked";
  if (
    name === "NotReadableError" ||
    name === "TrackStartError" ||
    name === "AbortError"
  ) {
    return "in-use";
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return "missing";
  }
  return "unknown";
}

/** Neither device works on a plain-http IP origin, so say it once. */
export function insecurePageCopy(): {
  title: string;
  steps: string;
  after: string;
} {
  return {
    title: "This page cannot use camera or microphone",
    steps:
      "Browsers only allow camera and microphone on localhost or https. Open http://localhost:3000 on this Mac instead of the IP address, or use an https link.",
    after: "Then check the boxes again.",
  };
}

export function cameraTroubleCopy(
  kind: DeviceErrorKind,
  family: BrowserFamily,
): { title: string; steps: string; after: string } {
  const retry = "Then check the Camera box again.";

  if (kind === "insecure") {
    return {
      title: "This page cannot use the camera",
      steps:
        "Browsers only allow camera and microphone on localhost or https. Open http://localhost:3000 on this Mac instead of the IP address, or use an https link.",
      after: retry,
    };
  }
  if (kind === "in-use") {
    return {
      title: "Camera is busy",
      steps:
        "Another app or tab is already using your camera. Close Zoom, Google Meet, Photo Booth, and other tabs of this site. If your MacBook lid is closed while you use an external monitor, open the lid.",
      after: retry,
    };
  }
  if (kind === "missing") {
    return {
      title: "Camera isn't available",
      steps:
        "You can continue with voice. This Interview does not need video.",
      after: "Try Camera again if you want a preview, or enter the classroom.",
    };
  }
  if (kind === "unknown") {
    return {
      title: "Camera isn't available",
      steps:
        "You can continue with voice. This Interview does not need video.",
      after: "Try Camera again if you want a preview, or enter the classroom.",
    };
  }

  const title = "Camera is blocked";
  if (family === "safari") {
    return {
      title,
      steps:
        "Safari menu → Settings… → Websites → Camera. Set localhost to Allow (or Ask). Also check Mac System Settings → Privacy & Security → Camera and make sure Safari is on. Then reload this page.",
      after: retry,
    };
  }
  if (family === "firefox") {
    return {
      title,
      steps:
        "Click the lock icon next to the website address → Connection secure → More information → Permissions → Use the Camera → Allow. Also check Mac System Settings → Privacy & Security → Camera. Then reload this page.",
      after: retry,
    };
  }
  if (family === "chrome") {
    return {
      title,
      steps:
        "Click the lock icon next to the website address → Site settings → Camera → Allow. Also check Mac System Settings → Privacy & Security → Camera. Then reload this page.",
      after: retry,
    };
  }
  return {
    title,
    steps:
      "Open this site’s settings in your browser, set Camera to Allow. Also check Mac System Settings → Privacy & Security → Camera. Then reload this page.",
    after: retry,
  };
}
