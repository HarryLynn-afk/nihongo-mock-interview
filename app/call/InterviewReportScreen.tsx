"use client";

import { useEffect, useRef, useState } from "react";
import type { UiLocale } from "@/lib/content/locale";
import { uiCopy } from "@/lib/content/uiCopy";
import type { ReportQuestionCard, ReportView } from "./buildReportView";

export const REPORT_STAMP_REVEAL_MS = 700;
export const REPORT_COACHING_REVEAL_MS = 1400;

const CX = 140;
const CY = 130;
const AXIS_RADIUS = 72;

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
  if (Math.abs(point.x - CX) < 10) return "middle";
  return point.x > CX ? "start" : "end";
}

function revealClass(visible: boolean) {
  return `transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`;
}

function HighlightedAnswer({
  text,
  quote,
  affirming,
}: {
  text: string;
  quote: string;
  affirming: boolean;
}) {
  if (!quote || quote === "（無言）" || !text.includes(quote)) {
    return <p className="text-eel">{text}</p>;
  }
  const start = text.indexOf(quote);
  return (
    <p className="text-eel">
      {text.slice(0, start)}
      <mark
        className={
          affirming
            ? "rounded-sm bg-feather/25 text-eel"
            : "rounded-sm bg-bee/30 text-eel"
        }
      >
        {quote}
      </mark>
      {text.slice(start + quote.length)}
    </p>
  );
}

function QuestionCard({
  card,
  locale,
}: {
  card: ReportQuestionCard;
  locale: UiLocale;
}) {
  const copy = uiCopy(locale);
  return (
    <article className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-eel">
            {copy.report.questionLabel} {card.questionIndex + 1} · {card.navLabel}
          </p>
          <p className="mt-1 text-eel/80">{card.japanese}</p>
        </div>
        <p className="rounded-full bg-feather/20 px-3 py-1 text-sm text-eel">
          {card.ratingLabel ? `${card.ratingLabel} · ` : ""}
          {card.scoreText}
        </p>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-eel/50">
              {copy.report.yourAnswer}
            </p>
            <div className="mt-2 rounded-xl border border-eel/10 bg-eel/5 px-4 py-3 text-sm leading-relaxed">
              <HighlightedAnswer
                text={card.transcript}
                quote={card.quote}
                affirming={card.affirming}
              />
            </div>
          </div>
          {locale === "my" ? (
            <p
              lang="my"
              data-testid="report-burmese"
              className="rounded-xl border border-eel/10 bg-eel/5 px-4 py-3 text-sm leading-relaxed text-eel/90"
            >
              {card.burmese ||
                "Burmese explanation uses locked templates. Live translation is not wired yet."}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-feather">
              {copy.report.whatWentWell}
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-eel/90">
              {card.strengths.length > 0 ? (
                card.strengths.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden="true">✓</span>
                    <span>{line}</span>
                  </li>
                ))
              ) : (
                <li className="text-eel/50">{copy.report.noStrength}</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-bee">
              {card.nextHeading}
            </p>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-eel/90">
              {card.improvements.length > 0 ? (
                card.improvements.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden="true">△</span>
                    <span>{line}</span>
                  </li>
                ))
              ) : (
                <li className="text-eel/50">{copy.report.noExtra}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-eel/50">
          {card.rewriteHeading}
        </p>
        <p className="mt-2 rounded-xl border border-feather/30 bg-feather/10 px-4 py-3 text-sm leading-relaxed text-eel">
          {card.rewrite || copy.report.noRewrite}
        </p>
      </div>
      {card.quote || card.evidence ? (
        <p className="text-xs text-eel/50">
          {card.quote && card.quote !== "（無言）" ? (
            <>
              {copy.report.evidence}: 「<span>{card.quote}</span>」. {card.evidence}
            </>
          ) : (
            `${copy.report.missingElement}: ${card.evidence}`
          )}
        </p>
      ) : null}
    </article>
  );
}

export function InterviewReportScreen({
  view,
  sessionId,
  locale = "en",
  onRevealComplete,
  onHelpStudy,
  onRequestFullSession,
}: {
  view: ReportView;
  sessionId?: string;
  locale?: UiLocale;
  onRevealComplete?: () => void;
  onHelpStudy?: () => void;
  onRequestFullSession?: () => void;
}) {
  const copy = uiCopy(locale);
  const [stage, setStage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const onRevealCompleteRef = useRef(onRevealComplete);

  useEffect(() => {
    onRevealCompleteRef.current = onRevealComplete;
  }, [onRevealComplete]);

  useEffect(() => {
    const stamp = window.setTimeout(() => setStage(1), REPORT_STAMP_REVEAL_MS);
    const coaching = window.setTimeout(() => {
      setStage(2);
      onRevealCompleteRef.current?.();
    }, REPORT_COACHING_REVEAL_MS);
    return () => {
      window.clearTimeout(stamp);
      window.clearTimeout(coaching);
    };
  }, []);

  const radarScores = view.scores.filter((score) => score.assessed);
  const selected = view.questions[selectedIndex] ?? view.questions[0];
  const hasTopAction = Boolean(onHelpStudy || onRequestFullSession);

  return (
    <section
      data-testid="interview-report"
      className="relative flex w-full min-w-0 flex-1 flex-col gap-4 rounded-2xl border border-eel/10 bg-white p-4 text-eel md:p-5"
    >
      {onHelpStudy ? (
        <button
          type="button"
          onClick={onHelpStudy}
          className="absolute right-4 top-4 z-10 rounded-full bg-feather px-4 py-2 text-sm font-medium text-white md:right-5 md:top-5"
        >
          {copy.report.helpTheStudy}
        </button>
      ) : null}
      {onRequestFullSession ? (
        <button
          type="button"
          onClick={onRequestFullSession}
          className="absolute right-4 top-4 z-10 rounded-full bg-feather px-4 py-2 text-sm font-medium text-white md:right-5 md:top-5"
        >
          {copy.fullSessionRequest.reportButton}
        </button>
      ) : null}
      <div
        className={`flex min-h-0 flex-1 flex-col gap-6 ${
          hasTopAction ? "pt-12" : ""
        }`}
      >
        <div data-testid="report-overview" className="flex flex-col gap-4">
          <header
            className={`flex flex-wrap items-end justify-between gap-3 ${
              hasTopAction ? "md:pr-40" : ""
            }`}
          >
            <div>
              <h1 className="text-xl font-medium">{view.title}</h1>
              <p className="mt-1 text-sm font-medium text-eel/80">
                {view.answerQualityTitle}
              </p>
              {view.banner ? (
                <p className="mt-1 text-sm text-eel/80">{view.banner}</p>
              ) : null}
              <p className="mt-2 text-sm text-eel/60">{view.disclaimer}</p>
              {sessionId ? (
                <p
                  data-testid="session-id"
                  className="mt-2 text-[10px] tracking-wide text-eel/40"
                >
                  {sessionId}
                </p>
              ) : null}
            </div>
            <div
              data-testid="report-stamp"
              className={`text-right ${revealClass(stage >= 1)}`}
            >
              <p className="text-3xl font-medium md:text-4xl">
                {view.total}/100
              </p>
              <p className="text-sm font-medium">
                {view.headlineLabel} —{" "}
                <span className={view.stampColorClass}>{view.stamp}</span>
              </p>
            </div>
          </header>

          <div className="grid gap-4 rounded-2xl border border-eel/10 bg-eel/5 p-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
            <div
              data-testid="readiness-radar"
              className={revealClass(stage >= 0)}
            >
              <svg viewBox="0 0 280 260" className="mx-auto h-52 w-full max-w-xs">
                {[0.4, 0.7, 1].map((level) => (
                  <polygon
                    key={level}
                    points={gridPolygon(level, radarScores.length)}
                    className="fill-none stroke-eel/15"
                  />
                ))}
                {radarScores.map((score, index) => {
                  const end = axisPoint(index, radarScores.length, AXIS_RADIUS);
                  return (
                    <line
                      key={`${score.key}-axis`}
                      x1={CX}
                      y1={CY}
                      x2={end.x}
                      y2={end.y}
                      className="stroke-eel/20"
                    />
                  );
                })}
                {radarScores.length > 0 ? (
                  <polygon
                    points={radarPolygon(radarScores)}
                    className="fill-feather/40 stroke-feather"
                  />
                ) : null}
                {radarScores.map((score, index) => {
                  const point = axisPoint(index, radarScores.length, 104);
                  return (
                    <text
                      key={`${score.key}-label`}
                      x={point.x}
                      y={point.y}
                      textAnchor={labelAnchor(index, radarScores.length)}
                      className="fill-eel text-[11px]"
                    >
                      {score.radarLabel}
                    </text>
                  );
                })}
              </svg>
            </div>
            <ul
              data-testid="report-score-bars"
              className="flex flex-col justify-center gap-2 text-sm"
            >
              {view.scores.map((score) => (
                <li key={score.key} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-eel/80">
                    {score.label}
                  </span>
                  {score.assessed ? (
                    <>
                      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-eel/10">
                        <span
                          className="block h-full rounded-full bg-feather"
                          style={{
                            width: `${Math.max(8, (score.points / score.weight) * 100)}%`,
                          }}
                        />
                      </span>
                      <span className="w-20 shrink-0 text-right text-xs text-eel/60">
                        {score.ratingLabel}
                      </span>
                      <span className="w-12 shrink-0 text-right tabular-nums">
                        {score.points}/{score.weight}
                      </span>
                    </>
                  ) : (
                    <span className="text-eel/50">
                      {copy.report.deliveryHeadline.notAssessed}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="text-xs text-eel/50 lg:col-span-2">
              {view.listeningNote}
              {view.voiceNote ? ` ${view.voiceNote}` : null}
            </p>
            {view.notes.map((line) => (
              <p key={line} className="text-xs text-eel/60 lg:col-span-2">
                {line}
              </p>
            ))}
          </div>

          {view.delivery ? (
            <div
              data-testid="speech-delivery-signals"
              className="rounded-2xl border border-eel/10 bg-eel/5 p-4"
            >
              <p className="text-xs font-medium tracking-wide text-eel/50">
                {view.deliveryTitle}
              </p>
              <p className="mt-1 text-lg font-medium">
                {view.delivery.headline}
              </p>
              <p className="mt-1 text-sm text-eel/70">{view.delivery.note}</p>
              {view.delivery.answers[0]?.observations.slice(0, 4).map((line) => (
                <p key={line} className="mt-1 text-xs text-eel/60">
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div data-testid="report-review" className="flex flex-col gap-3">
          <div
            data-testid="report-question-nav"
            className="flex flex-col gap-2"
          >
            <p className="text-xs font-medium tracking-wide text-eel/50">
              {copy.report.transcript}
            </p>
            <nav className="flex flex-wrap gap-2">
              {view.questions.map((card) => {
                const selectedNav = card.questionIndex === selectedIndex;
                return (
                  <button
                    key={card.questionIndex}
                    type="button"
                    onClick={() => {
                      setSelectedIndex(card.questionIndex);
                    }}
                    className={`rounded-full px-3 py-1.5 text-left text-sm ${
                      selectedNav
                        ? "bg-feather/30 text-eel"
                        : "bg-eel/5 text-eel/80"
                    }`}
                  >
                    <span className="font-medium">
                      Q{card.questionIndex + 1} {card.navLabel}
                    </span>
                    <span className="ml-2 text-xs text-eel/60">
                      {card.scoreText}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div
            data-testid="report-critiques"
            className={`flex min-h-[18rem] flex-1 flex-col overflow-y-auto rounded-2xl border border-eel/10 bg-eel/5 p-4 ${revealClass(stage >= 2)}`}
          >
            {selected ? (
              <QuestionCard card={selected} locale={locale} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
