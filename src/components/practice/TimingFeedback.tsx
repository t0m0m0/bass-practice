import type {
  TabSessionPhase,
  TimingEvent,
  TimingJudgment,
} from "../../types/practice";
import { Card } from "../md3";

interface TimingFeedbackProps {
  lastEvent: TimingEvent | null;
  eventSeq?: number;
  stats: {
    hitRate: number;
    avgAbsDeltaMs: number;
    pitchAccuracy: number;
    avgAbsCents: number;
    pitchJudgedCount: number;
  };
  phase: TabSessionPhase;
  timingEvents: TimingEvent[];
  loop: number;
  maxCombo?: number;
}

/** How many most-recent hits to show on the live timing scatter. */
const SCATTER_WINDOW = 12;

const JUDGMENT_CONFIG: Record<
  TimingJudgment,
  { label: string; color: string; bg: string }
> = {
  hit: { label: "HIT", color: "#4ecdc4", bg: "#4ecdc41a" },
  perfect: { label: "PERFECT", color: "#66ffcc", bg: "#66ffcc22" },
  "timing-only": { label: "TIMING", color: "#ffb74d", bg: "#ffb74d1a" },
  early: { label: "EARLY", color: "#f9a825", bg: "#f9a8251a" },
  late: { label: "LATE", color: "#ff7043", bg: "#ff70431a" },
  miss: { label: "MISS", color: "#ef5350", bg: "#ef53501a" },
};

export function TimingFeedback({
  lastEvent,
  eventSeq = 0,
  stats,
  phase,
  timingEvents,
  loop,
  maxCombo = 0,
}: TimingFeedbackProps) {
  if (phase === "idle") return null;

  const cfg = lastEvent ? JUDGMENT_CONFIG[lastEvent.judgment] : null;
  const delta =
    lastEvent && lastEvent.judgment !== "miss" ? lastEvent.deltaMs : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {phase === "playing" && (
        <Card style={{ padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                font: "500 16px/1 Roboto, sans-serif",
                color: "var(--md-on-surface)",
              }}
            >
              Timing
            </div>
            <span
              style={{
                font: "400 12px/1 Roboto, sans-serif",
                color: "var(--md-on-surface-variant)",
                background: "var(--md-surface-container)",
                padding: "4px 10px",
                borderRadius: 12,
              }}
            >
              Loop {loop + 1}
            </span>
          </div>

          {lastEvent && cfg ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                key={`judgment-${eventSeq}`}
                className="judgment-bounce-anim"
                style={{
                  font: "700 36px/1 Roboto, sans-serif",
                  letterSpacing: 2,
                  color: cfg.color,
                  background: cfg.bg,
                  padding: "10px 32px",
                  borderRadius: 16,
                  animation:
                    "judgment-bounce 0.35s cubic-bezier(.2,1.4,.3,1)",
                }}
              >
                {cfg.label}
              </div>

              {lastEvent.judgment !== "miss" && (
                <div
                  style={{
                    font: "400 14px/1.3 Roboto Mono, monospace",
                    color: "var(--md-on-surface-variant)",
                    textAlign: "center",
                  }}
                >
                  {lastEvent.deltaMs !== 0 && (
                    <>
                      {lastEvent.deltaMs > 0 ? "+" : ""}
                      {lastEvent.deltaMs}ms
                    </>
                  )}
                  {lastEvent.pitchCents != null && (
                    <div>
                      {lastEvent.pitchCents > 0 ? "+" : ""}
                      {lastEvent.pitchCents}¢
                    </div>
                  )}
                </div>
              )}

              <div style={{ width: "100%" }}>
                <div
                  style={{
                    position: "relative",
                    height: 6,
                    background: "var(--md-surface-container-highest)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      width: 1,
                      height: "100%",
                      background: "var(--md-outline)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      height: "100%",
                      width: 8,
                      borderRadius: 3,
                      background: cfg.color,
                      left: `${50 + (delta / 100) * 40}%`,
                      transform: "translateX(-50%)",
                      transition: "left 0.1s",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      font: "400 11px/1 Roboto, sans-serif",
                      color: "var(--md-on-surface-variant)",
                    }}
                  >
                    Early
                  </span>
                  <span
                    style={{
                      font: "400 11px/1 Roboto, sans-serif",
                      color: "var(--md-on-surface-variant)",
                    }}
                  >
                    Late
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                font: "400 15px/1 Roboto, sans-serif",
                color: "var(--md-on-surface-variant)",
                padding: "16px 0",
              }}
            >
              Play a note...
            </div>
          )}

          <TimingScatter events={timingEvents} />
        </Card>
      )}

      {(phase === "playing" || phase === "finished") &&
        timingEvents.length > 0 && (
          <Card style={{ padding: 20 }}>
            <div
              style={{
                font: "500 16px/1 Roboto, sans-serif",
                color: "var(--md-on-surface)",
                marginBottom: 16,
              }}
            >
              {phase === "finished" ? "Results" : "Stats"}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: "var(--md-surface-container)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    font: "700 32px/1 Roboto, sans-serif",
                    color: "var(--md-primary)",
                  }}
                >
                  {Math.round(stats.hitRate * 100)}%
                </div>
                <div
                  style={{
                    font: "400 12px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface-variant)",
                    marginTop: 4,
                  }}
                >
                  Hit Rate
                </div>
              </div>
              <div
                style={{
                  background: "var(--md-surface-container)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    font: "700 32px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface)",
                  }}
                >
                  {stats.avgAbsDeltaMs}ms
                </div>
                <div
                  style={{
                    font: "400 12px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface-variant)",
                    marginTop: 4,
                  }}
                >
                  Avg Offset
                </div>
              </div>
            </div>
            {stats.pitchJudgedCount > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    background: "var(--md-surface-container)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      font: "700 32px/1 Roboto, sans-serif",
                      color: "#66ffcc",
                    }}
                  >
                    {Math.round(stats.pitchAccuracy * 100)}%
                  </div>
                  <div
                    style={{
                      font: "400 12px/1 Roboto, sans-serif",
                      color: "var(--md-on-surface-variant)",
                      marginTop: 4,
                    }}
                  >
                    Pitch Accuracy
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--md-surface-container)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      font: "700 32px/1 Roboto, sans-serif",
                      color: "var(--md-on-surface)",
                    }}
                  >
                    {stats.avgAbsCents}¢
                  </div>
                  <div
                    style={{
                      font: "400 12px/1 Roboto, sans-serif",
                      color: "var(--md-on-surface-variant)",
                      marginTop: 4,
                    }}
                  >
                    Avg Cents
                  </div>
                </div>
              </div>
            )}
            {maxCombo >= 3 && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "#66ffcc14",
                  color: "#66ffcc",
                  font: "600 13px/1.4 Roboto, sans-serif",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                🔥 Max combo: {maxCombo}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["perfect", "timing-only", "hit", "early", "late", "miss"] as TimingJudgment[]).map(
                (j) => {
                  const count = timingEvents.filter(
                    (e) => e.judgment === j,
                  ).length;
                  if (!count) return null;
                  return (
                    <span
                      key={j}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 8,
                        background: JUDGMENT_CONFIG[j].bg,
                        color: JUDGMENT_CONFIG[j].color,
                        font: "500 12px/1.5 Roboto, sans-serif",
                      }}
                    >
                      {JUDGMENT_CONFIG[j].label}: {count}
                    </span>
                  );
                },
              )}
            </div>
          </Card>
        )}
    </div>
  );
}

/**
 * Live scatter of the last N hit events on a ±100ms axis. Each dot lingers
 * so the player can see their timing “drift” over recent attempts.
 */
function TimingScatter({ events }: { events: TimingEvent[] }) {
  const recent = events
    .filter((e): e is Exclude<TimingEvent, { judgment: "miss" }> =>
      e.judgment !== "miss",
    )
    .slice(-SCATTER_WINDOW);
  if (recent.length === 0) return null;

  return (
    <div style={{ width: "100%", marginTop: 16 }}>
      <div
        style={{
          font: "500 10px/1 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        Recent timing ({recent.length})
      </div>
      <div
        style={{
          position: "relative",
          height: 28,
          background: "var(--md-surface-container-highest)",
          borderRadius: 14,
          overflow: "hidden",
        }}
        aria-label="Recent timing scatter"
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 4,
            bottom: 4,
            width: 2,
            background: "var(--md-primary)",
            opacity: 0.6,
            borderRadius: 1,
          }}
        />
        {recent.map((e, i) => {
          const clamped = Math.max(-100, Math.min(100, e.deltaMs));
          const left = `${50 + (clamped / 100) * 48}%`;
          const recency = (i + 1) / recent.length; // 0..1, newest=1
          const color =
            e.judgment === "perfect"
              ? "#66ffcc"
              : e.judgment === "hit"
              ? "#4ecdc4"
              : e.judgment === "timing-only"
              ? "#ffb74d"
              : "#f9a825";
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left,
                top: "50%",
                width: 8,
                height: 8,
                borderRadius: 4,
                background: color,
                transform: "translate(-50%, -50%)",
                opacity: 0.25 + recency * 0.75,
                boxShadow:
                  recency > 0.9 ? `0 0 8px ${color}` : undefined,
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          font: "400 10px/1 Roboto Mono, monospace",
          color: "var(--md-on-surface-variant)",
        }}
      >
        <span>−100ms</span>
        <span>0</span>
        <span>+100ms</span>
      </div>
    </div>
  );
}
