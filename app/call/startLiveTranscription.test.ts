import { describe, expect, it, vi } from "vitest";
import { startLiveTranscriptionSession } from "./startLiveTranscription";

describe("startLiveTranscriptionSession", () => {
  it("returns null when the Deepgram token route is unavailable", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "unavailable" }),
    });

    const session = await startLiveTranscriptionSession({
      onEvent: vi.fn(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      WebSocketImpl: class {
        static OPEN = 1;
        readyState = 1;
        binaryType = "";
        addEventListener() {}
        send() {}
        close() {}
      } as unknown as typeof WebSocket,
      AudioContextImpl: class {
        sampleRate = 16000;
        destination = {};
        createMediaStreamSource() {
          return { connect: vi.fn() };
        }
        createScriptProcessor() {
          return { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null };
        }
        close() {}
      } as unknown as new () => never,
    });

    expect(session).toBeNull();
  });
});
