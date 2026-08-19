"use client";

import { useEffect, useState } from "react";
import type { ReportView } from "./buildReportView";

export const REPORT_STAMP_REVEAL_MS = 700;
export const REPORT_COACHING_REVEAL_MS = 1400;

function radarPolygon(scores: ReportView["scores"]) {
  const cx = 80;
  const cy = 80;
  const radius = 64;
  return scores
    .map((score, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / scores.length;
      const r = (score.raw / 5) * radius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(" ");
}

function revealClass(visible: boolean) {
  return `transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`;
}

export function InterviewReportScreen({ view }: { view: ReportView }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const stamp = window.setTimeout(() => setStage(1), REPORT_STAMP_REVEAL_MS);
    const coaching = window.setTimeout(
      () => setStage(2),
      REPORT_COACHING_REVEAL_MS,
    );
    return () => {
      window.clearTimeout(stamp);
      window.clearTimeout(coaching);
    };
  }, []);

  return (
    <section
      data-testid="interview-report"
      className="flex w-full max-w-xl flex-col items-center gap-4 rounded-2xl border border-indigo/30 bg-ink p-6 text-paper"
    >
      <h1 className="text-xl font-medium">{view.title}</h1>
      <div data-testid="readiness-radar" className={revealClass(stage >= 0)}>
        <svg
          viewBox="0 0 160 160"
          className="h-40 w-40 fill-indigo/40 stroke-indigo"
        >
          <polygon points={radarPolygon(view.scores)} />
        </svg>
      </div>
      <div data-testid="report-stamp" className={revealClass(stage >= 1)}>
        <p className={`text-4xl font-medium ${view.stampColorClass}`}>
          {view.stamp}
        </p>
        <p className="text-lg">{view.total}/100</p>
      </div>
      <ul className="grid w-full grid-cols-2 gap-2 text-sm">
        {view.scores.map((score) => (
          <li key={score.key}>
            <span>{score.label}</span> {score.raw} ({score.points})
          </li>
        ))}
      </ul>
      <ul
        data-testid="report-coaching"
        className={`flex w-full flex-col gap-2 text-sm text-paper/90 ${revealClass(stage >= 2)}`}
      >
        {view.coaching.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
