interface CountdownOverlayProps {
  /** Current countdown beat remaining (e.g. 3, 2, 1). `null` hides the overlay. */
  count: number | null;
}

/**
 * Fullscreen-ish overlay that displays the current count-in beat (3/2/1)
 * before a practice session starts. The component keys its animation on
 * `count` so each number re-runs the fade-and-scale effect.
 */
export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count === null) return null;
  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.55)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <div
        key={count}
        style={{
          font: "500 160px/1 Roboto, sans-serif",
          color: "var(--md-primary, #bb86fc)",
          textShadow: "0 4px 24px rgba(0,0,0,0.6)",
          animation: "countdownPulse 1s ease-out both",
        }}
      >
        {count}
      </div>
      <style>{`
        @keyframes countdownPulse {
          0%   { opacity: 0; transform: scale(1.6); }
          20%  { opacity: 1; transform: scale(1.0); }
          100% { opacity: 0; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
