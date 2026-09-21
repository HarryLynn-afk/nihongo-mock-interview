import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInterviewLobby } from "./useInterviewLobby";

describe("useInterviewLobby", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts already started when skipLobby is true", () => {
    const { result } = renderHook(() => useInterviewLobby({ skipLobby: true }));

    expect(result.current.devicesVisible).toBe(false);
    expect(result.current.reminderVisible).toBe(false);
    expect(result.current.interviewStarted).toBe(true);
  });

  it("starts idle when startIdle is true, then Join opens the device step", () => {
    const { result } = renderHook(() =>
      useInterviewLobby({ skipLobby: false, startIdle: true }),
    );

    expect(result.current.devicesVisible).toBe(false);
    expect(result.current.reminderVisible).toBe(false);
    expect(result.current.interviewStarted).toBe(false);

    act(() => {
      result.current.openDevices();
    });
    expect(result.current.devicesVisible).toBe(true);
  });

  it("opens on the device step with no timer running", () => {
    const { result } = renderHook(() => useInterviewLobby({ skipLobby: false }));

    expect(result.current.devicesVisible).toBe(true);
    expect(result.current.reminderVisible).toBe(false);
    expect(result.current.interviewStarted).toBe(false);

    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(result.current.devicesVisible).toBe(true);
    expect(result.current.interviewStarted).toBe(false);
  });

  it("Enter classroom keeps the lobby and shows the 15s popup; start waits for 0", () => {
    const { result } = renderHook(() => useInterviewLobby({ skipLobby: false }));

    act(() => {
      result.current.continueFromDevices();
    });

    expect(result.current.devicesVisible).toBe(true);
    expect(result.current.reminderVisible).toBe(true);
    expect(result.current.secondsLeft).toBe(15);
    expect(result.current.interviewStarted).toBe(false);

    act(() => {
      vi.advanceTimersByTime(14_000);
    });
    expect(result.current.secondsLeft).toBe(1);
    expect(result.current.interviewStarted).toBe(false);
    expect(result.current.devicesVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.reminderVisible).toBe(true);
    expect(result.current.devicesVisible).toBe(true);
    expect(result.current.interviewStarted).toBe(true);
  });

  it("Skip on the reminder starts the interview without leaving the lobby page", () => {
    const { result } = renderHook(() => useInterviewLobby({ skipLobby: false }));

    act(() => {
      result.current.continueFromDevices();
    });
    act(() => {
      result.current.skipReminder();
    });

    expect(result.current.reminderVisible).toBe(true);
    expect(result.current.devicesVisible).toBe(true);
    expect(result.current.interviewStarted).toBe(true);
  });
});
