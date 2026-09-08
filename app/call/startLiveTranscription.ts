import {
  commitAudioBufferMessage,
  parseTranscriptionEvent,
  type ParsedTranscriptionEvent,
} from "./transcriptionEvents";

export type LiveTranscriptionSession = {
  stop: () => void;
  commit: () => void;
};

export async function startLiveTranscriptionSession({
  onEvent,
  fetchImpl = fetch,
  getUserMedia = () => navigator.mediaDevices.getUserMedia({ audio: true }),
  PeerConnection = globalThis.RTCPeerConnection,
}: {
  onEvent: (event: ParsedTranscriptionEvent) => void;
  fetchImpl?: typeof fetch;
  getUserMedia?: () => Promise<MediaStream>;
  PeerConnection?: typeof RTCPeerConnection;
}): Promise<LiveTranscriptionSession | null> {
  if (typeof PeerConnection !== "function") return null;

  const tokenRes = await fetchImpl("/api/realtime-stt", { method: "POST" });
  if (!tokenRes.ok) return null;
  let tokenBody: unknown;
  try {
    tokenBody = await tokenRes.json();
  } catch {
    return null;
  }
  if (typeof tokenBody !== "object" || tokenBody === null) return null;
  const ephemeralKey = (tokenBody as { value?: unknown }).value;
  if (typeof ephemeralKey !== "string") return null;

  const pc = new PeerConnection();
  const dataChannel = pc.createDataChannel("oai-events");
  let stream: MediaStream | null = null;

  dataChannel.addEventListener("message", (event: MessageEvent<string>) => {
    try {
      const parsed = parseTranscriptionEvent(JSON.parse(event.data));
      if (parsed) onEvent(parsed);
    } catch {
      // ignore malformed realtime frames
    }
  });

  try {
    stream = await getUserMedia();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream as MediaStream);
    });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const sdpResponse = await fetchImpl("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ephemeralKey}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp ?? "",
    });
    if (!sdpResponse.ok) {
      stopSession();
      return null;
    }
    const answerSdp = await sdpResponse.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
  } catch {
    stopSession();
    return null;
  }

  function stopSession() {
    dataChannel.close();
    pc.close();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  return {
    stop: stopSession,
    commit: () => {
      if (dataChannel.readyState === "open") {
        dataChannel.send(commitAudioBufferMessage());
      }
    },
  };
}
