import { describe, expect, it, vi } from "vitest";
import { openUserCamera } from "./openUserCamera";

function requestedDeviceId(video: MediaStreamConstraints["video"]): string | undefined {
  if (typeof video !== "object" || !video) return undefined;
  const id = video.deviceId;
  if (typeof id === "string") return id;
  if (typeof id === "object" && id) {
    if ("ideal" in id && typeof id.ideal === "string") return id.ideal;
    if ("exact" in id && typeof id.exact === "string") return id.exact;
  }
  return undefined;
}

describe("openUserCamera", () => {
  it("opens a listed camera when the default video request is overconstrained", async () => {
    const fallback = { id: "iphone-stream" } as unknown as MediaStream;
    const getUserMedia = vi.fn(
      async (constraints: MediaStreamConstraints) => {
        if (constraints.video === true) {
          throw Object.assign(new Error("over"), {
            name: "OverconstrainedError",
          });
        }
        const video = constraints.video;
        if (requestedDeviceId(video) === "iphone") {
          return fallback;
        }
        throw Object.assign(new Error("missing"), { name: "NotFoundError" });
      },
    );
    const enumerateDevices = vi.fn(async () => [
      {
        kind: "videoinput" as const,
        deviceId: "iphone",
        label: "iPhone",
        groupId: "",
        toJSON: () => ({}),
      },
    ]);

    const result = await openUserCamera({ getUserMedia, enumerateDevices });

    expect(result).toEqual({ stream: fallback });
  });

  it("returns the last camera error when device enumeration rejects", async () => {
    const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => {
      if (constraints.video === true) {
        throw Object.assign(new Error("over"), { name: "OverconstrainedError" });
      }
      throw Object.assign(new Error("missing"), { name: "NotFoundError" });
    });
    const enumerateDevices = vi.fn(async () => {
      throw Object.assign(new Error("denied"), { name: "SecurityError" });
    });

    const result = await openUserCamera({ getUserMedia, enumerateDevices });

    expect(result).toEqual({ errorName: "NotFoundError" });
    expect(enumerateDevices).toHaveBeenCalledTimes(2);
  });

  it("does not try other cameras when the site is not allowed to use the camera", async () => {
    const getUserMedia = vi.fn(async () => {
      throw Object.assign(new Error("denied"), { name: "NotAllowedError" });
    });
    const enumerateDevices = vi.fn(async () => [
      {
        kind: "videoinput" as const,
        deviceId: "iphone",
        label: "iPhone",
        groupId: "",
        toJSON: () => ({}),
      },
    ]);

    const result = await openUserCamera({ getUserMedia, enumerateDevices });

    expect(result).toEqual({ errorName: "NotAllowedError" });
    expect(enumerateDevices).not.toHaveBeenCalled();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("opens a loose video stream when the default request is overconstrained and no device ids are listed", async () => {
    const loose = { id: "loose-stream" } as unknown as MediaStream;
    const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => {
      if (constraints.video === true) {
        throw Object.assign(new Error("over"), {
          name: "OverconstrainedError",
        });
      }
      if (
        typeof constraints.video === "object" &&
        constraints.video &&
        Object.keys(constraints.video).length === 0
      ) {
        return loose;
      }
      throw Object.assign(new Error("missing"), { name: "NotFoundError" });
    });

    const result = await openUserCamera({
      getUserMedia,
      enumerateDevices: async () => [
        {
          kind: "videoinput" as const,
          deviceId: "",
          label: "",
          groupId: "",
          toJSON: () => ({}),
        },
      ],
    });

    expect(result).toEqual({ stream: loose });
  });

  it("opens a camera that appears after the first device list", async () => {
    const late = { id: "late-iphone" } as unknown as MediaStream;
    let listed = false;
    const getUserMedia = vi.fn(async (constraints: MediaStreamConstraints) => {
      if (requestedDeviceId(constraints.video) === "iphone") return late;
      throw Object.assign(new Error("over"), { name: "OverconstrainedError" });
    });
    const enumerateDevices = vi.fn(async () =>
      listed
        ? [
            {
              kind: "videoinput" as const,
              deviceId: "iphone",
              label: "iPhone",
              groupId: "",
              toJSON: () => ({}),
            },
          ]
        : [],
    );
    const delay = vi.fn(async () => {
      listed = true;
    });

    const result = await openUserCamera({
      getUserMedia,
      enumerateDevices,
      delay,
    });

    expect(result).toEqual({ stream: late });
    expect(delay).toHaveBeenCalled();
  });
});
