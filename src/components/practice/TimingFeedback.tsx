import type {
  TabSessionPhase,
  TimingEvent,
  TimingJudgment,
} from "../../types/practice";
import { Card } from "../md3";

interface TimingFeedbackProps {
  lastEvent: TimingEvent | null;
  stats: { hitRate: number; avgAbsDeltaMs: number };
  phase: TabSessionPhase;
  timingEvents: TimingEvent[];
  loop: number;
}

const JUDGMENT_CONFIG: Record<
  TimingJudgment,
  { label: string; color: string; bg: string }
> = {
  hit: { label: "HIT", color: "#4ecdc4", bg: "#4ecdc41a" },
  early: { label: "EARLY", color: "#f9a825", bg: "#f9a8251a" },
  late: { label: "LATE", color: "#ff7043", bg: "#ff70431a" },
  miss: { label: "MISS", color: "#ef5350", bg: "#ef53501a" },
};

export function TimingFeedback({
  lastEvent,
  stats,
  phase,
  timingEvents,
  loop,
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
                style={{
                  font: "700 36px/1 Roboto, sans-serif",
                  letterSpacing: 2,
                  color: cfg.color,
                  background: cfg.bg,
                  padding: "10px 32px",
                  borderRadius: 16,
                }}
              >
                {cfg.label}
              </div>

              {lastEvent.judgment !== "miss" && lastEvent.deltaMs !== 0 && (
                <div
                  style={{
                    font: "400 14px/1 Roboto Mono, monospace",
                    color: "var(--md-on-surface-variant)",
                  }}
                >
                  {lastEvent.deltaMs > 0 ? "+" : ""}
                  {lastEvent.deltaMs}ms
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
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["hit", "early", "late", "miss"] as TimingJudgment[]).map(
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
