export type RecordingQuality = "pass" | "warning" | "notAssessed";

export type DeliveryStatus =
  | "unavailable"
  | "notAssessed"
  | "needsPractice"
  | "clearEnough";

export type AnalyzedClip = {
  recordingQuality: RecordingQuality;
  durationSec: number | null;
  speechRateCps: number | null;
  longPauseCount: number | null;
  fillerCount: number;
  observations: string[];
};

export type DeliveryAnswer = AnalyzedClip & {
  questionIndex: number;
};

export type SessionDelivery = {
  status: DeliveryStatus;
  headline: string;
  note: string;
  recordingQuality: RecordingQuality | "unavailable";
  answers: DeliveryAnswer[];
};

export const DELIVERY_SECTION_TITLE = "Speech Delivery Signals";
export const ANSWER_QUALITY_TITLE = "Interview Answer Quality";
export const DELIVERY_NOT_PROFICIENCY =
  "These are timing signals, not a Japanese proficiency score.";

const FRAME_MS = 30;
const SILENCE_RMS = 0.02;
const QUIET_RMS = 0.008;
const CLIP_PEAK = 0.99;
const LONG_PAUSE_SEC = 1.5;
const MIN_DURATION_SEC = 0.4;
const FILLER_PATTERN = /えーと|えっと|うーん|あの|えー|んー/g;

const NOT_ASSESSED_OBS = [
  "Audio was too quiet or too short to analyze.",
];

export const DELIVERY_HEADLINE: Record<DeliveryStatus, string> = {
  unavailable: "Not assessed",
  notAssessed: "Not assessed",
  needsPractice: "Needs practice",
  clearEnough: "Clear enough",
};

export const DELIVERY_NOTE: Record<DeliveryStatus, string> = {
  unavailable: "No spoken answer was captured to analyze.",
  notAssessed:
    "Recording was too quiet or too short for basic timing analysis.",
  needsPractice:
    "Your answer included several long pauses. Audio was clear enough for basic timing analysis.",
  clearEnough:
    "Audio was clear enough for basic timing analysis. These are timing signals, not a Japanese proficiency score.",
};

export function notAssessedClip(): AnalyzedClip {
  return {
    recordingQuality: "notAssessed",
    durationSec: null,
    speechRateCps: null,
    longPauseCount: null,
    fillerCount: 0,
    observations: [...NOT_ASSESSED_OBS],
  };
}

export function countFillers(transcript: string): number {
  return [...transcript.matchAll(FILLER_PATTERN)].length;
}

export function japaneseCharCount(transcript: string): number {
  let count = 0;
  for (const char of transcript) {
    if (/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(char)) {
      count += 1;
    }
  }
  return count;
}

function frameRms(samples: Float32Array, start: number, end: number): number {
  if (end <= start) return 0;
  let sum = 0;
  for (let i = start; i < end; i += 1) {
    const sample = samples[i] ?? 0;
    sum += sample * sample;
  }
  return Math.sqrt(sum / (end - start));
}

export function analyzePcm({
  samples,
  sampleRate,
  transcript,
}: {
  samples: Float32Array;
  sampleRate: number;
  transcript: string;
}): AnalyzedClip {
  const fillerCount = countFillers(transcript);
  const durationSec = samples.length / sampleRate;
  if (!Number.isFinite(durationSec) || durationSec < MIN_DURATION_SEC) {
    return notAssessedClip();
  }

  let peak = 0;
  let energy = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const abs = Math.abs(samples[i] ?? 0);
    if (abs > peak) peak = abs;
    energy += abs * abs;
  }
  const rms = Math.sqrt(energy / samples.length);
  if (rms < QUIET_RMS) return notAssessedClip();

  const frameSize = Math.max(1, Math.round((sampleRate * FRAME_MS) / 1000));
  const frameCount = Math.floor(samples.length / frameSize);
  const silent: boolean[] = [];
  for (let f = 0; f < frameCount; f += 1) {
    const start = f * frameSize;
    silent.push(frameRms(samples, start, start + frameSize) < SILENCE_RMS);
  }

  const firstVoice = silent.findIndex((isSilent) => !isSilent);
  let lastVoice = silent.length - 1;
  while (lastVoice >= 0 && silent[lastVoice]) lastVoice -= 1;
  if (firstVoice === -1 || lastVoice < firstVoice) {
    return notAssessedClip();
  }

  let longPauseCount = 0;
  let run = 0;
  for (let f = firstVoice; f <= lastVoice; f += 1) {
    if (silent[f]) {
      run += 1;
    } else {
      if ((run * FRAME_MS) / 1000 >= LONG_PAUSE_SEC) longPauseCount += 1;
      run = 0;
    }
  }
  if ((run * FRAME_MS) / 1000 >= LONG_PAUSE_SEC) longPauseCount += 1;

  const voicedFrames =
    lastVoice -
    firstVoice +
    1 -
    silent.slice(firstVoice, lastVoice + 1).filter(Boolean).length;
  const voicedSec = Math.max(0.01, (voicedFrames * FRAME_MS) / 1000);
  const chars = japaneseCharCount(transcript);
  const speechRateCps =
    chars > 0 ? Math.round((chars / voicedSec) * 10) / 10 : null;

  const recordingQuality: RecordingQuality =
    rms < SILENCE_RMS || peak >= CLIP_PEAK ? "warning" : "pass";

  const durationRounded = Math.round(durationSec * 10) / 10;
  const observations: string[] = [
    `Answer lasted ${durationRounded} seconds.`,
  ];
  if (speechRateCps !== null) {
    observations.push(
      `Approximate speech rate: ${speechRateCps} characters per second.`,
    );
  }
  if (longPauseCount >= 2) {
    observations.push("Several long pauses.");
  } else if (longPauseCount === 1) {
    observations.push("One long pause.");
  }
  if (fillerCount >= 2) {
    observations.push("Filler words appeared more than once.");
  }
  if (recordingQuality === "pass") {
    observations.push("Audio was clear enough for basic timing analysis.");
  } else {
    observations.push("Recording quality warning — timing is approximate.");
  }
  observations.push(DELIVERY_NOT_PROFICIENCY);

  return {
    recordingQuality,
    durationSec: durationRounded,
    speechRateCps,
    longPauseCount,
    fillerCount,
    observations,
  };
}

export function summarizeDelivery(
  items: readonly {
    questionIndex: number;
    signal: AnalyzedClip | null;
  }[],
): SessionDelivery {
  if (items.length === 0) {
    return {
      status: "unavailable",
      headline: DELIVERY_HEADLINE.unavailable,
      note: DELIVERY_NOTE.unavailable,
      recordingQuality: "unavailable",
      answers: [],
    };
  }

  const answers: DeliveryAnswer[] = items.map((item) => ({
    questionIndex: item.questionIndex,
    ...(item.signal ?? notAssessedClip()),
  }));
  const analyzed = answers.filter(
    (answer) => answer.recordingQuality !== "notAssessed",
  );
  if (analyzed.length === 0) {
    return {
      status: "notAssessed",
      headline: DELIVERY_HEADLINE.notAssessed,
      note: DELIVERY_NOTE.notAssessed,
      recordingQuality: "notAssessed",
      answers,
    };
  }

  const needsPractice = analyzed.some(
    (answer) => (answer.longPauseCount ?? 0) >= 2,
  );
  const status: DeliveryStatus = needsPractice
    ? "needsPractice"
    : "clearEnough";
  const hasWarning = analyzed.some(
    (answer) => answer.recordingQuality === "warning",
  );

  return {
    status,
    headline: DELIVERY_HEADLINE[status],
    note: DELIVERY_NOTE[status],
    recordingQuality: hasWarning ? "warning" : "pass",
    answers,
  };
}
