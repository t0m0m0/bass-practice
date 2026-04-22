import { Fragment, useState } from "react";
import type { TabNote, TabPreset } from "../../types/practice";
import { toggleNote } from "../../lib/customTabs";
import { Card } from "../md3";

interface TabGridProps {
  preset: TabPreset;
  onNotesChange: (notes: TabNote[]) => void;
}

const STRING_LABELS = ["G", "D", "A", "E"]; // string 1..4
const MAX_FRET = 24;

export function TabGrid({ preset, onNotesChange }: TabGridProps) {
  const [selectedFret, setSelectedFret] = useState<number>(0);
  const totalBeats = preset.timeSignature.beatsPerMeasure * preset.measures;
  const beatsPerMeasure = preset.timeSignature.beatsPerMeasure;

  const cellAt = (stringNum: number, beat: number): TabNote | undefined =>
    preset.notes.find((n) => n.string === stringNum && n.beat === beat);

  const handleCellClick = (stringNum: number, beat: number) => {
    onNotesChange(toggleNote(preset.notes, stringNum, beat, selectedFret));
  };

  const cellW = 40;
  const labelW = 28;

  return (
    <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Fret picker */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          style={{
            font: "500 11px/1 Roboto, sans-serif",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: "var(--md-on-surface-variant)",
          }}
        >
          フレット選択（セルタップで配置 / 同じセル再タップで削除）
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Array.from({ length: MAX_FRET + 1 }, (_, i) => {
            const active = i === selectedFret;
            return (
              <button
                key={i}
                onClick={() => setSelectedFret(i)}
                aria-pressed={active}
                style={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: 8,
                  border: active
                    ? "2px solid var(--md-primary)"
                    : "1px solid var(--md-outline-variant)",
                  background: active
                    ? "var(--md-primary-container)"
                    : "var(--md-surface-container)",
                  color: active
                    ? "var(--md-on-primary-container)"
                    : "var(--md-on-surface)",
                  font: "500 13px/1 Roboto, sans-serif",
                  cursor: "pointer",
                }}
              >
                {i}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${labelW}px repeat(${totalBeats}, ${cellW}px)`,
            gap: 2,
            minWidth: labelW + totalBeats * (cellW + 2),
          }}
        >
          {/* Header row: beat numbers */}
          <div />
          {Array.from({ length: totalBeats }, (_, beat) => {
            const measureIdx = Math.floor(beat / beatsPerMeasure);
            const beatInMeasure = (beat % beatsPerMeasure) + 1;
            const isDownbeat = beat % beatsPerMeasure === 0;
            return (
              <div
                key={`h-${beat}`}
                style={{
                  textAlign: "center",
                  font: "500 10px/1.3 Roboto, sans-serif",
                  color: "var(--md-on-surface-variant)",
                  paddingBottom: 4,
                  borderLeft: isDownbeat
                    ? "2px solid var(--md-outline)"
                    : "none",
                }}
              >
                {isDownbeat && (
                  <div style={{ color: "var(--md-primary)", fontWeight: 600 }}>
                    M{measureIdx + 1}
                  </div>
                )}
                <div>{beatInMeasure}</div>
              </div>
            );
          })}

          {/* String rows */}
          {STRING_LABELS.map((label, i) => {
            const stringNum = i + 1;
            return (
              <Fragment key={`row-${stringNum}`}>
                <div
                  key={`l-${stringNum}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font: "600 14px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface-variant)",
                  }}
                >
                  {label}
                </div>
                {Array.from({ length: totalBeats }, (_, beat) => {
                  const note = cellAt(stringNum, beat);
                  const isDownbeat = beat % beatsPerMeasure === 0;
                  return (
                    <button
                      key={`c-${stringNum}-${beat}`}
                      onClick={() => handleCellClick(stringNum, beat)}
                      style={{
                        height: 36,
                        borderRadius: 6,
                        border: isDownbeat
                          ? "1px solid var(--md-outline)"
                          : "1px solid var(--md-outline-variant)",
                        background: note
                          ? "var(--md-primary)"
                          : "var(--md-surface-container-low)",
                        color: note
                          ? "var(--md-on-primary)"
                          : "var(--md-on-surface-variant)",
                        font: "500 13px/1 Roboto, sans-serif",
                        cursor: "pointer",
                      }}
                    >
                      {note ? note.fret : ""}
                    </button>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
