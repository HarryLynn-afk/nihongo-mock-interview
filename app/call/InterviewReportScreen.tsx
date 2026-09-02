"use client";

import { useEffect, useState } from "react";
import type { ReportView } from "./buildReportView";

export const REPORT_STAMP_REVEAL_MS = 700;
export const REPORT_COACHING_REVEAL_MS = 1400;

const CX = 110;
const CY = 110;
const AXIS_RADIUS = 68;

function axisPoint(index: number, count: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function radarPolygon(scores: ReportView["scores"]) {
  return scores
    .map((score, index) => {
      const point = axisPoint(index, scores.length, (score.raw / 5) * AXIS_RADIUS);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

function gridPolygon(level: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const point = axisPoint(index, count, AXIS_RADIUS * level);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function labelAnchor(index: number, count: number) {
  const point = axisPoint(index, count, AXIS_RADIUS);
  if (Math.abs(point.x - CX) < 8) return "middle";
  return point.x > CX ? "start" : "end";
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
      className="flex w-full max-w-2xl flex-1 flex-col items-center gap-5 rounded-2xl border border-paper/10 bg-ink p-6 text-paper"
    >
      <h1 className="text-xl font-medium">{view.title}</h1>
      <div data-testid="readiness-radar" className={revealClass(stage >= 0)}>
        <svg viewBox="0 0 220 220" className="h-56 w-56">
          {[0.4, 0.7, 1].map((level) => (
            <polygon
              key={level}
              points={gridPolygon(level, view.scores.length)}
              className="fill-none stroke-paper/15"
            />
          ))}
          {view.scores.map((score, index) => {
            const end = axisPoint(index, view.scores.length, AXIS_RADIUS);
            return (
              <line
                key={`${score.key}-axis`}
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                className="stroke-paper/20"
              />
            );
          })}
          <polygon
            points={radarPolygon(view.scores)}
            className="fill-indigo/40 stroke-indigo"
          />
          {view.scores.map((score, index) => {
            const point = axisPoint(index, view.scores.length, 96);
            return (
              <text
                key={`${score.key}-label`}
                x={point.x}
                y={point.y}
                textAnchor={labelAnchor(index, view.scores.length)}
                className="fill-paper text-[9px]"
              >
                {score.label}
              </text>
            );
          })}
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
