import {
  cameraTroubleCopy,
  classifyDeviceError,
  detectBrowserFamily,
  micTroubleCopy,
} from "./micBlockedHelp";

/**
 * On the call screen, explain a failed microphone (or camera) with the same
 * fix-it steps the lobby shows, instead of silently flipping the toggle off.
 * The microphone wins when both failed, since the Interview needs the mic.
 */
export function CallDeviceNotice({
  micErrorName,
  cameraErrorName,
}: {
  micErrorName: string | null;
  cameraErrorName: string | null;
}) {
  const family = detectBrowserFamily(
    typeof navigator === "undefined" ? "" : navigator.userAgent,
  );
  const help = micErrorName
    ? micTroubleCopy(classifyDeviceError(micErrorName), family)
    : cameraErrorName
      ? cameraTroubleCopy(classifyDeviceError(cameraErrorName), family)
      : null;

  if (!help) return null;

  return (
    <div
      data-testid="call-device-notice"
      role="status"
      className="w-full rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-left text-sm text-eel"
    >
      <p className="font-medium">{help.title}</p>
      <p className="mt-1 text-wolf">{help.steps}</p>
      <p className="mt-1 text-wolf">{help.after}</p>
    </div>
  );
}
