const STORAGE_KEY = "nmi-device-prefs";

export type DevicePrefs = {
  cameraOn: boolean;
  micOn: boolean;
};

export function saveDevicePrefs(prefs: DevicePrefs) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function loadDevicePrefs(): DevicePrefs {
  if (typeof window === "undefined") {
    return { cameraOn: true, micOn: true };
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { cameraOn: true, micOn: true };
    const parsed = JSON.parse(raw) as Partial<DevicePrefs>;
    return {
      cameraOn: parsed.cameraOn !== false,
      micOn: parsed.micOn !== false,
    };
  } catch {
    return { cameraOn: true, micOn: true };
  }
}
