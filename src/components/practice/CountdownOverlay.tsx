interface CountdownOverlayProps {
  /** Current countdown beat remaining (e.g. 3, 2, 1). `null` hides the overlay. */
  count: number | null;
}

/**
 * Fullscreen-ish overlay that displays the current count-in beat (3/2/1)
 * before a practice session starts. The component keys its animation on
 * `count` so each number re-runs the fade-and-scale effect.
 *
 * A11y: `role="timer"` + `aria-live="assertive"` announces each tick
 * without the role/live-region conflict that `role="status"` +
 * `aria-live="assertive"` causes on some screen readers. `aria-atomic`
 * makes SRs re-announce the whole value on each change rather than only
 * the diff, matching the visual "3 → 2 → 1" cadence.
 */
export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count === null) return null;
  return (
    <div
      role="timer"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={`開始まで ${count}`}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 pointer-events-none"
    >
      <div
        key={count}
        className="countdown-overlay__num"
        style={{
          // clamp keeps the digit readable on phones without overflowing;
          // 20vw scales between the min/max on tablets/desktops.
          fontSize: "clamp(64px, 20vw, 160px)",
          fontWeight: 500,
          lineHeight: 1,
          fontFamily: "Roboto, sans-serif",
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
