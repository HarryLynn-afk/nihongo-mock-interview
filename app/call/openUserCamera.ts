export type CameraOpenResult =
  | { stream: MediaStream }
  | { errorName: string };

const NO_RETRY_ERRORS = new Set([
  "NotAllowedError",
  "SecurityError",
  "NotSupportedError",
]);

const CAMERA_SETTLE_MS = 600;

function errorNameOf(error: unknown): string {
  const name = (error as { name?: unknown } | null)?.name;
  return typeof name === "string" && name ? name : "UnknownError";
}

async function tryListedCameras(
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
  devices: MediaDeviceInfo[],
): Promise<CameraOpenResult | { lastName: string }> {
  let lastName = "";
  for (const device of devices) {
    if (device.kind !== "videoinput" || !device.deviceId) continue;
    try {
      return {
        stream: await getUserMedia({
          video: { deviceId: { ideal: device.deviceId } },
        }),
      };
    } catch (nextError) {
      lastName = errorNameOf(nextError);
    }
  }
  return { lastName };
}

async function tryEnumerateDevices(
  enumerateDevices: () => Promise<MediaDeviceInfo[]>,
): Promise<MediaDeviceInfo[]> {
  try {
    return await enumerateDevices();
  } catch {
    // A failed listing must stay inside the documented error result.
    return [];
  }
}

export async function openUserCamera({
  getUserMedia,
  enumerateDevices,
  delay = async () => {},
  settleMs = 0,
}: {
  getUserMedia: (
    constraints: MediaStreamConstraints,
  ) => Promise<MediaStream>;
  enumerateDevices: () => Promise<MediaDeviceInfo[]>;
  delay?: (ms: number) => Promise<void>;
  settleMs?: number;
}): Promise<CameraOpenResult> {
  try {
    return { stream: await getUserMedia({ video: true }) };
  } catch (error) {
    const firstName = errorNameOf(error);
    if (NO_RETRY_ERRORS.has(firstName)) {
      return { errorName: firstName };
    }
    let lastName = firstName;
    try {
      // Safari often treats { video: true } as the built-in camera.
      return { stream: await getUserMedia({ video: {} }) };
    } catch (looseError) {
      lastName = errorNameOf(looseError);
      if (NO_RETRY_ERRORS.has(lastName)) {
        return { errorName: lastName };
      }
    }

    const firstList = await tryListedCameras(
      getUserMedia,
      await tryEnumerateDevices(enumerateDevices),
    );
    if ("stream" in firstList) return firstList;
    if ("lastName" in firstList && firstList.lastName) lastName = firstList.lastName;

    await delay(settleMs);
    const secondList = await tryListedCameras(
      getUserMedia,
      await tryEnumerateDevices(enumerateDevices),
    );
    if ("stream" in secondList) return secondList;
    if ("lastName" in secondList && secondList.lastName) lastName = secondList.lastName;

    return { errorName: lastName };
  }
}

export function openNavigatorCamera(): Promise<CameraOpenResult> {
  const devices = navigator.mediaDevices;
  if (!devices?.getUserMedia) {
    return Promise.resolve({ errorName: "NotSupportedError" });
  }
  return openUserCamera({
    getUserMedia: (constraints) => devices.getUserMedia(constraints),
    enumerateDevices: () =>
      devices.enumerateDevices?.() ?? Promise.resolve([]),
    delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    settleMs: CAMERA_SETTLE_MS,
  });
}
