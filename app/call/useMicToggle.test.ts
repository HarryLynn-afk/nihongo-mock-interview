import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMicToggle } from "./useMicToggle";

describe("useMicToggle", () => {
  it("defaults to on, and toggleMic flips it off then back on", () => {
    const { result } = renderHook(() => useMicToggle());

    expect(result.current.micOn).toBe(true);

    act(() => {
      result.current.toggleMic();
    });
    expect(result.current.micOn).toBe(false);

    act(() => {
      result.current.toggleMic();
    });
    expect(result.current.micOn).toBe(true);
  });
});
