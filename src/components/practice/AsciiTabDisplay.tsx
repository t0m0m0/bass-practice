import { useEffect, useMemo, useRef } from "react";
import type { TabPreset, TabNote } from "../../types/practice";
import { Card } from "../md3";

interface AsciiTabDisplayProps {
  preset: TabPreset;
  currentBeat: number;
  isPlaying: boolean;
  beatWidth?: number;
}

const STRING_LABELS = ["G", "D", "A", "E"];
const STRING_THICKNESS = [1, 1.5, 2, 2.5];
const DEFAULT_BEAT_W = 48;
const ROW_H = 52;
const LABEL_W = 36;
const PADDING = 16;

export function AsciiTabDisplay({
  preset,
  currentBeat,
  isPlaying,
  beatWidth = DEFAULT_BEAT_W,
}: AsciiTabDisplayProps) {
  const BEAT_W = beatWidth;
  const totalBeats = preset.timeSignature.beatsPerMeasure * preset.measures;
  const bpm = preset.timeSignature.beatsPerMeasure;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const noteMap = useMemo(() => {
    const map = new Map<number, Map<number, TabNote>>();
    for (const note of preset.notes) {
      if (!map.has(note.string)) map.set(note.string, new Map());
      map.get(note.string)!.set(note.beat, note);
    }
    return map;
  }, [preset.notes]);

  useEffect(() => {
    if (!isPlaying || currentBeat < 0 || !scrollRef.current) return;
    const x = LABEL_W + currentBeat * BEAT_W - 80;
    scrollRef.current.scrollTo({ left: Math.max(0, x), behavior: "smooth" });
  }, [currentBeat, isPlaying]);

  const svgW = LABEL_W + totalBeats * BEAT_W + PADDING;
  const svgH = 4 * ROW_H + 32;

  return (
    <Card style={{ padding: "16px 0 8px" }}>
      <div
        style={{
          font: "500 11px/1 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          padding: "0 16px",
          marginBottom: 12,
        }}
      >
        タブ譜
      </div>

      <div
        ref={scrollRef}
        style={{ overflowX: "auto", overflowY: "visible", paddingBottom: 4 }}
      >
        <svg
          width={svgW}
          height={svgH}
          style={{ display: "block", overflow: "visible" }}
        >
          {Array.from({ length: totalBeats }, (_, beat) => {
            const x = LABEL_W + beat * BEAT_W;
            const isCurrent = isPlaying && beat === currentBeat;
            const isDownbeat = beat % bpm === 0;
            return (
              <g key={beat}>
                {isCurrent && (
                  <rect
                    x={x + 2}
                    y={4}
                    width={BEAT_W - 4}
                    height={4 * ROW_H - 8}
                    rx={8}
                    fill="var(--md-primary)"
                    opacity={0.12}
                  />
                )}
                {isDownbeat && !isCurrent && (
                  <rect
                    x={x}
                    y={0}
                    width={BEAT_W}
                    height={4 * ROW_H}
                    fill="var(--md-on-surface)"
                    opacity={0.025}
                  />
                )}
              </g>
            );
          })}

          {Array.from({ length: preset.measures + 1 }, (_, m) => {
            const x = LABEL_W + m * bpm * BEAT_W;
            return (
              <line
                key={m}
                x1={x}
                y1={8}
                x2={x}
                y2={4 * ROW_H - 8}
                stroke="var(--md-outline)"
                strokeWidth={m === 0 || m === preset.measures ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}

          {[1, 2, 3, 4].map((stringNum, si) => {
            const cy = si * ROW_H + ROW_H / 2;
            const stringNotes = noteMap.get(stringNum) ?? new Map<number, TabNote>();
            const thickness = STRING_THICKNESS[si];

            return (
              <g key={stringNum}>
                <text
                  x={LABEL_W - 10}
                  y={cy + 1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--md-primary)"
                  fontSize={12}
                  fontFamily="Roboto, sans-serif"
                  fontWeight={500}
                >
                  {STRING_LABELS[si]}
                </text>

                {Array.from({ length: totalBeats }, (_, beat) => {
                  const hasNote = stringNotes.has(beat);
                  const x1 = LABEL_W + beat * BEAT_W;
                  const x2 = x1 + BEAT_W;
                  return hasNote ? null : (
                    <line
                      key={beat}
                      x1={x1}
                      y1={cy}
                      x2={x2}
                      y2={cy}
                      stroke="var(--md-outline-variant)"
                      strokeWidth={thickness}
                    />
                  );
                })}

                {Array.from({ length: totalBeats }, (_, beat) => {
                  const note = stringNotes.get(beat);
                  if (!note) return null;
                  const cx = LABEL_W + beat * BEAT_W + BEAT_W / 2;
                  const isCurrent = isPlaying && beat === currentBeat;
                  const r = isCurrent ? 18 : 15;

                  return (
                    <g key={beat}>
                      {isCurrent && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={22}
                          fill="var(--md-primary)"
                          opacity={0.18}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={
                          isCurrent
                            ? "var(--md-primary)"
                            : "var(--md-surface-container-highest)"
                        }
                        stroke={isCurrent ? "none" : "var(--md-outline)"}
                        strokeWidth={1}
                        style={{ transition: "r 0.1s, fill 0.1s" }}
                      />
                      <text
                        x={cx}
                        y={cy + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={
                          isCurrent
                            ? "var(--md-on-primary)"
                            : "var(--md-on-surface)"
                        }
                        fontSize={note.fret > 9 ? 10 : 13}
                        fontFamily="Roboto Mono, monospace"
                        fontWeight={600}
                      >
                        {note.fret}
                      </text>
                      {note.label && (
                        <text
                          x={cx}
                          y={cy + r + 9}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={
                            isCurrent
                              ? "var(--md-primary)"
                              : "var(--md-on-surface-variant)"
                          }
                          fontSize={9}
                          fontFamily="Roboto, sans-serif"
                          fontWeight={500}
                          opacity={0.85}
                        >
                          {note.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {Array.from({ length: totalBeats }, (_, beat) => {
            const x = LABEL_W + beat * BEAT_W + BEAT_W / 2;
            const y = 4 * ROW_H + 16;
            const isCurrent = isPlaying && beat === currentBeat;
            const beatInMeasure = (beat % bpm) + 1;
            const isOne = beatInMeasure === 1;
            return (
              <text
                key={beat}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={
                  isCurrent
                    ? "var(--md-primary)"
                    : isOne
                      ? "var(--md-on-surface-variant)"
                      : "var(--md-outline)"
                }
                fontSize={isOne ? 12 : 10}
                fontFamily="Roboto, sans-serif"
                fontWeight={isCurrent || isOne ? 600 : 400}
              >
                {beatInMeasure}
              </text>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}
