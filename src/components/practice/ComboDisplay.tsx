interface ComboDisplayProps {
  combo: number;
  /** Monotonic sequence so the pop animation retriggers on each new event. */
  seq: number;
}

/**
 * Floating combo counter. Hidden below 3 — we only want to celebrate
 * actual streaks, not the first hit. Grows louder as combo climbs.
 */
export function ComboDisplay({ combo, seq }: ComboDisplayProps) {
  if (combo < 3) return null;

  // Tiers: 3–5 subtle, 6–10 bright, 11+ on fire.
  const tier = combo >= 11 ? 2 : combo >= 6 ? 1 : 0;
  const color = tier === 2 ? "#ffd54f" : tier === 1 ? "#66ffcc" : "#4ecdc4";
  const glow =
    tier === 2
      ? "0 0 24px #ffd54f99, 0 0 48px #ffd54f55"
      : tier === 1
      ? "0 0 16px #66ffcc88"
      : "0 0 8px #4ecdc466";
  const fontSize = tier === 2 ? 56 : tier === 1 ? 48 : 40;

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        right: 16,
        pointerEvents: "none",
        textAlign: "right",
        zIndex: 2,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        key={seq}
        className="combo-pop-anim"
        style={{
          animation: "combo-pop 0.35s cubic-bezier(.2,1.4,.3,1)",
          font: `700 ${fontSize}px/1 Roboto, sans-serif`,
          color,
          textShadow: glow,
          letterSpacing: 1,
        }}
      >
        {combo}
      </div>
      <div
        style={{
          font: "500 11px/1 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
          letterSpacing: 2,
          marginTop: 4,
        }}
      >
        COMBO{tier === 2 ? " 🔥" : ""}
      </div>
    </div>
  );
}
