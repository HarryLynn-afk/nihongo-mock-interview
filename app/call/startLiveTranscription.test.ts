import { describe, expect, it, vi } from "vitest";
import { startLiveTranscriptionSession } from "./startLiveTranscription";

describe("startLiveTranscriptionSession", () => {
  it("returns null when the ephemeral route is unavailable", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "unavailable" }),
    });

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      PeerConnection: class {
        createDataChannel() {
          return { addEventListener: vi.fn(), close: vi.fn(), readyState: "closed", send: vi.fn() };
        }
        addTrack() {}
        createOffer() {
          return Promise.resolve({ sdp: "offer" });
        }
        setLocalDescription() {
          return Promise.resolve();
        }
        setRemoteDescription() {
          return Promise.resolve();
        }
        close() {}
      } as unknown as typeof RTCPeerConnection,
    });

    expect(session).toBeNull();
  });
});
