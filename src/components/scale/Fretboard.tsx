import type { FretPosition } from "../../types/music";

interface FretboardProps {
  positions: FretPosition[];
  rootPitchClass: string;
  startFret: number;
  endFret: number;
  highlightPosition?: FretPosition | null;
  detectedPitchClass?: string | null;
}

const STRING_LABELS = ["G", "D", "A", "E"]; // string 1..4
const INLAY_FRETS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAY_FRETS = new Set([12, 24]);

export function Fretboard({
  positions,
  rootPitchClass,
  startFret,
  endFret,
  highlightPosition,
  detectedPitchClass,
}: FretboardProps) {
  const fretCount = endFret - startFret + 1;
  // +1 for the nut/open column
  const cols = fretCount;
  const rows = 4;

  return (
    <div
      style={{
        background: "var(--md-surface-container)",
        borderRadius: 16,
        padding: 12,
        overflowX: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `28px repeat(${cols}, minmax(44px, 1fr))`,
          gridTemplateRows: `auto repeat(${rows}, 40px) auto`,
          gap: 0,
          minWidth: cols * 44 + 28,
        }}
      >
        {/* Top fret numbers */}
        <div />
        {Array.from({ length: fretCount }, (_, i) => {
          const fret = startFret + i;
          return (
            <div
              key={`top-${fret}`}
              style={{
                textAlign: "center",
                font: "500 11px/1 Roboto, sans-serif",
                color: "var(--md-on-surface-variant)",
                paddingBottom: 4,
              }}
            >
              {fret}
            </div>
          );
        })}

        {Array.from({ length: rows }, (_, r) => {
          const stringNum = r + 1; // 1..4
          return (
            <FretRow
              key={`row-${stringNum}`}
              stringNum={stringNum}
              stringLabel={STRING_LABELS[r]}
              startFret={startFret}
              endFret={endFret}
              positions={positions}
              rootPitchClass={rootPitchClass}
              highlightPosition={highlightPosition ?? null}
              detectedPitchClass={detectedPitchClass ?? null}
            />
          );
        })}

        {/* Inlays row */}
        <div />
        {Array.from({ length: fretCount }, (_, i) => {
          const fret = startFret + i;
          return (
            <div
              key={`inlay-${fret}`}
              style={{
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {DOUBLE_INLAY_FRETS.has(fret) ? (
                <>
                  <Dot />
                  <Dot />
                </>
              ) : INLAY_FRETS.has(fret) ? (
                <Dot />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        background: "var(--md-outline)",
        display: "inline-block",
      }}
    />
  );
}

interface FretRowProps {
  stringNum: number;
  stringLabel: string;
  startFret: number;
  endFret: number;
  positions: FretPosition[];
  rootPitchClass: string;
  highlightPosition: FretPosition | null;
  detectedPitchClass: string | null;
}

function FretRow({
  stringNum,
  stringLabel,
  startFret,
  endFret,
  positions,
  rootPitchClass,
  highlightPosition,
  detectedPitchClass,
}: FretRowProps) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "500 12px/1 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
        }}
      >
        {stringLabel}
      </div>
      {Array.from({ length: endFret - startFret + 1 }, (_, i) => {
        const fret = startFret + i;
        const pos = positions.find(
          (p) => p.string === stringNum && p.fret === fret,
        );
        const isRoot = pos && pos.pitchClass === rootPitchClass;
        const isHighlight =
          highlightPosition &&
          highlightPosition.string === stringNum &&
          highlightPosition.fret === fret;
        const isDetected =
          pos && detectedPitchClass && pos.pitchClass === detectedPitchClass;

        return (
          <div
            key={`cell-${stringNum}-${fret}`}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight:
                fret === 0
                  ? "3px solid var(--md-on-surface-variant)"
                  : "1px solid var(--md-outline-variant)",
              borderLeft: i === 0 ? "1px solid var(--md-outline-variant)" : "",
            }}
          >
            {/* String line */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50%",
                height: 1 + Math.max(0, 4 - stringNum) * 0.3,
                background: "var(--md-outline)",
                opacity: 0.5,
              }}
            />
            {pos && (
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: isHighlight ? 32 : 26,
                  height: isHighlight ? 32 : 26,
                  borderRadius: "50%",
                  background: isHighlight
                    ? "var(--md-tertiary)"
                    : isRoot
                      ? "var(--md-primary)"
                      : "var(--md-secondary-container)",
                  color: isHighlight
                    ? "var(--md-on-tertiary)"
                    : isRoot
                      ? "var(--md-on-primary)"
                      : "var(--md-on-secondary-container)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: `${isRoot || isHighlight ? 600 : 500} 11px/1 Roboto, sans-serif`,
                  boxShadow: isHighlight
                    ? "0 0 0 3px var(--md-tertiary-container)"
                    : isDetected
                      ? "0 0 0 3px var(--md-primary)"
                      : "0 1px 2px rgba(0,0,0,0.2)",
                  transition: "all 120ms ease",
                }}
              >
                {pos.pitchClass}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
