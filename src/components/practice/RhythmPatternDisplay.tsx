import { useEffect, useMemo, useRef } from "react";
import type { RhythmPattern } from "../../types/rhythm";
import type { TimingEvent } from "../../types/practice";
import { Card } from "../md3";

interface RhythmPatternDisplayProps {
  pattern: RhythmPattern;
  currentBeat: number; // fractional beat within the full pattern (from metronome)
  isPlaying: boolean;
  timingEvents: TimingEvent[];
  loop: number;
}

const CELL_W_BASE = 36;
const ROW_H = 96;
const LEFT_PAD = 12;
const RIGHT_PAD = 12;

/**
 * Visual rhythm notation: one circle per onset step, rest symbols, accent
 * markers, beat labels (1 e & a), current-beat highlight, and a timing
 * scatter showing each attempt's delta-ms from the target.
 */
export function RhythmPatternDisplay({
  pattern,
  currentBeat,
  isPlaying,
  timingEvents,
  loop,
}: RhythmPatternDisplayProps) {
  const { steps, timeSignature, measures, subdivision } = pattern;
  const totalBeats = timeSignature.beatsPerMeasure * measures;

  // Use the finest subdivision as column unit so triplet shuffle still fits.
  const unit = 1 / Math.max(subdivision, 2);
  const columnCount = Math.ceil(totalBeats / unit);
  const cellW = columnCount > 32 ? CELL_W_BASE * 0.75 : CELL_W_BASE;
  const svgW = LEFT_PAD + columnCount * cellW + RIGHT_PAD;
  const svgH = ROW_H + 60;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isPlaying || currentBeat < 0 || !scrollRef.current) return;
    const x = LEFT_PAD + (currentBeat / unit) * cellW - 80;
    scrollRef.current.scrollTo({ left: Math.max(0, x), behavior: "smooth" });
  }, [currentBeat, isPlaying, cellW, unit]);

  // Latest event per target beat (within current loop window of display).
  const latestEventByBeat = useMemo(() => {
    const map = new Map<number, TimingEvent>();
    for (const e of timingEvents) {
      map.set(e.targetBeat, e);
    }
    return map;
  }, [timingEvents]);

  const beatToX = (beat: number) => LEFT_PAD + (beat / unit) * cellW + cellW / 2;
  const cursorX = isPlaying && currentBeat >= 0 ? beatToX(currentBeat) : null;

  const stepRowY = 48;
  const timelineY = ROW_H + 28;

  return (
    <Card style={{ padding: "16px 0 8px" }}>
      <div
        style={{
          font: "500 11px/1 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          padding: "0 16px",
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>リズムパターン</span>
        <span>LOOP {loop + 1}</span>
      </div>

      <div ref={scrollRef} style={{ overflowX: "auto", paddingBottom: 4 }}>
        <svg width={svgW} height={svgH} style={{ display: "block" }}>
          {/* Measure separators & beat gridlines */}
          {Array.from({ length: totalBeats + 1 }, (_, b) => {
            const x = LEFT_PAD + (b / unit) * cellW;
            const isBar = b % timeSignature.beatsPerMeasure === 0;
            return (
              <line
                key={`grid-${b}`}
                x1={x}
                x2={x}
                y1={24}
                y2={ROW_H}
                stroke={isBar ? "var(--md-outline)" : "var(--md-outline-variant)"}
                strokeWidth={isBar ? 1.5 : 1}
              />
            );
          })}

          {/* Beat number labels across the top */}
          {Array.from({ length: totalBeats }, (_, b) => {
            const x = LEFT_PAD + (b / unit) * cellW + 4;
            return (
              <text
                key={`beatlabel-${b}`}
                x={x}
                y={18}
                fill="var(--md-on-surface-variant)"
                style={{ font: "500 11px Roboto, sans-serif" }}
              >
                {(b % timeSignature.beatsPerMeasure) + 1}
              </text>
            );
          })}

          {/* Current-beat highlight */}
          {cursorX !== null && (
            <line
              x1={cursorX}
              x2={cursorX}
              y1={24}
              y2={ROW_H}
              stroke="var(--md-primary)"
              strokeWidth={2}
            />
          )}

          {/* Steps */}
          {steps.map((step, i) => {
            const x = beatToX(step.beat);
            const evt = latestEventByBeat.get(step.beat);
            let fill = "var(--md-primary)";
            let stroke = "var(--md-primary)";
            if (step.rest) {
              fill = "transparent";
              stroke = "var(--md-outline)";
            } else if (evt) {
              if (evt.judgment === "hit") fill = "#4ecdc4";
              else if (evt.judgment === "early") fill = "#f9a825";
              else if (evt.judgment === "late") fill = "#ff7043";
              else if (evt.judgment === "miss") fill = "#ef5350";
            }
            return (
              <g key={`step-${i}`}>
                {step.rest ? (
                  <text
                    x={x}
                    y={stepRowY + 6}
                    textAnchor="middle"
                    fill="var(--md-on-surface-variant)"
                    style={{ font: "300 20px Roboto, sans-serif" }}
                  >
                    ‖
                  </text>
                ) : (
                  <circle
                    cx={x}
                    cy={stepRowY}
                    r={step.accent ? 11 : 9}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={step.accent ? 3 : 1}
                  />
                )}
                {step.label && (
                  <text
                    x={x}
                    y={stepRowY + 28}
                    textAnchor="middle"
                    fill="var(--md-on-surface-variant)"
                    style={{ font: "400 11px Roboto, sans-serif" }}
                  >
                    {step.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Timing scatter (delta ms from target, ±100ms range) */}
          <line
            x1={LEFT_PAD}
            x2={svgW - RIGHT_PAD}
            y1={timelineY}
            y2={timelineY}
            stroke="var(--md-outline-variant)"
            strokeWidth={1}
          />
          {timingEvents
            .filter((e) => e.judgment !== "miss")
            .map((e, i) => {
              const x = beatToX(e.targetBeat);
              const delta = (e as { deltaMs: number }).deltaMs;
              const offsetY = Math.max(-20, Math.min(20, (delta / 100) * 20));
              const color =
                e.judgment === "hit"
                  ? "#4ecdc4"
                  : e.judgment === "early"
                    ? "#f9a825"
                    : "#ff7043";
              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={timelineY + offsetY}
                  r={3}
                  fill={color}
                  opacity={0.85}
                />
              );
            })}
        </svg>
      </div>
    </Card>
  );
}
