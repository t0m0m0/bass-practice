import type { TimingEvent, TimingJudgment } from "../../types/practice";

interface TimingFeedbackProps {
  lastEvent: TimingEvent | null;
  stats: { hitRate: number; avgAbsDeltaMs: number };
  phase: string;
  timingEvents: TimingEvent[];
  loop: number;
}

const judgmentColors: Record<TimingJudgment, string> = {
  hit: "text-green-400",
  early: "text-yellow-400",
  late: "text-orange-400",
  miss: "text-red-400",
};

const judgmentLabels: Record<TimingJudgment, string> = {
  hit: "HIT",
  early: "EARLY",
  late: "LATE",
  miss: "MISS",
};

export function TimingFeedback({
  lastEvent,
  stats,
  phase,
  timingEvents,
  loop,
}: TimingFeedbackProps) {
  return (
    <div className="space-y-4">
      {/* Live feedback */}
      {phase === "playing" && (
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">Timing</h3>
            <span className="text-xs text-slate-500">Loop {loop + 1}</span>
          </div>

          {lastEvent ? (
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${judgmentColors[lastEvent.judgment]}`}
              >
                {judgmentLabels[lastEvent.judgment]}
              </div>
              {lastEvent.judgment !== "miss" && lastEvent.deltaMs !== 0 && (
                <div className="text-sm text-slate-400 mt-1">
                  {lastEvent.deltaMs > 0 ? "+" : ""}
                  {lastEvent.deltaMs}ms
                </div>
              )}

              {/* Timing bar visualization */}
              <div className="mt-3 relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="absolute left-1/2 w-0.5 h-full bg-white/30" />
                <div
                  className={`absolute top-0 h-full w-2 rounded-full transition-all ${
                    lastEvent.judgment === "hit"
                      ? "bg-green-400"
                      : lastEvent.judgment === "early"
                        ? "bg-yellow-400"
                        : "bg-orange-400"
                  }`}
                  style={{
                    left: `${50 + ((lastEvent.judgment !== "miss" ? lastEvent.deltaMs : 0) / 100) * 40}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>Early</span>
                <span>Late</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500">Play a note...</div>
          )}
        </div>
      )}

      {/* Summary (shown during play and at end) */}
      {(phase === "playing" || phase === "finished") && timingEvents.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {phase === "finished" ? "Results" : "Stats"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.round(stats.hitRate * 100)}%
              </div>
              <div className="text-xs text-slate-400">Hit Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.avgAbsDeltaMs}ms
              </div>
              <div className="text-xs text-slate-400">Avg Offset</div>
            </div>
          </div>

          {/* Event breakdown */}
          <div className="mt-3 flex gap-3 text-xs">
            {(["hit", "early", "late", "miss"] as TimingJudgment[]).map(
              (j) => {
                const count = timingEvents.filter(
                  (e) => e.judgment === j,
                ).length;
                if (count === 0) return null;
                return (
                  <span key={j} className={judgmentColors[j]}>
                    {judgmentLabels[j]}: {count}
                  </span>
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
}
