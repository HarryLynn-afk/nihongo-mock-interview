import { afterEach, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { loadDevicePrefs, saveDevicePrefs } from "./devicePrefs";
import { resetUiLocaleForTests, useUiLocale } from "./useUiLocale";
import { loadSeenQuestionIds, saveSeenQuestionIds } from "../call/seenQuestionIds";
import { markFullSessionRequestSent, readFullSessionRequestSent } from "@/lib/content/fullSessionRequest";

afterEach(() => { vi.restoreAllMocks(); resetUiLocaleForTests(); });

it("keeps practice and language controls usable when browser storage is blocked", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Full", "QuotaExceededError"); });
  expect(() => saveDevicePrefs({ micOn: false, cameraOn: false })).not.toThrow();
  expect(loadDevicePrefs()).toEqual({ micOn: false, cameraOn: false });
  expect(() => saveSeenQuestionIds([101])).not.toThrow();
  expect(loadSeenQuestionIds()).toEqual([]);
  expect(readFullSessionRequestSent()).toBe(false);
  expect(() => markFullSessionRequestSent()).not.toThrow();
  const { result } = renderHook(() => useUiLocale());
  act(() => result.current.setLocale("my"));
  expect(result.current.locale).toBe("my");
});
