import type { TimingEvent, TabNote, HitTimingEvent, MissTimingEvent } from "../../types/practice";

const HIT_WINDOW_MS = 100;

export interface TimingTarget {
  beat: number;
  timeMs: number;
}

/**
 * Build timing targets from tab notes and BPM.
 * Each unique beat in notes produces one target.
 */
export function buildTimingTargets(
  notes: TabNote[],
  bpm: number,
  startTimeMs: number,
): TimingTarget[] {
  const msPerBeat = (60 / bpm) * 1000;
  const uniqueBeats = [...new Set(notes.map((n) => n.beat))].sort(
    (a, b) => a - b,
  );
  return uniqueBeats.map((beat) => ({
    beat,
    timeMs: startTimeMs + beat * msPerBeat,
  }));
}

/**
 * Match an onset time to the nearest target beat.
 * Returns the TimingEvent or null if no target is within the hit window.
 */
export function evaluateOnset(
  onsetTimeMs: number,
  targets: TimingTarget[],
  alreadyHitBeats: Set<number>,
): HitTimingEvent | null {
  let closest: TimingTarget | null = null;
  let minDelta = Infinity;

  for (const target of targets) {
    if (alreadyHitBeats.has(target.beat)) continue;
    const delta = onsetTimeMs - target.timeMs;
    if (Math.abs(delta) < Math.abs(minDelta)) {
      minDelta = delta;
      closest = target;
    }
  }

  if (!closest || Math.abs(minDelta) > HIT_WINDOW_MS) {
    return null;
  }

  const judgment: "hit" | "early" | "late" =
    Math.abs(minDelta) <= 30 ? "hit" : minDelta < 0 ? "early" : "late";

  return {
    targetBeat: closest.beat,
    targetTimeMs: closest.timeMs,
    onsetTimeMs,
    deltaMs: Math.round(minDelta),
    judgment,
  };
}

/**
 * Generate miss events for targets that were never hit.
 */
export function generateMisses(
  targets: TimingTarget[],
  hitBeats: Set<number>,
): MissTimingEvent[] {
  return targets
    .filter((t) => !hitBeats.has(t.beat))
    .map((t) => ({
      targetBeat: t.beat,
      targetTimeMs: t.timeMs,
      onsetTimeMs: null as null,
      deltaMs: null as null,
      judgment: "miss" as const,
    }));
}

/**
 * Compute summary stats from timing events.
 */
export function computeStats(events: TimingEvent[]): {
  hitRate: number;
  avgAbsDeltaMs: number;
} {
  if (events.length === 0) return { hitRate: 0, avgAbsDeltaMs: 0 };

  const hits = events.filter((e): e is import("../../types/practice").HitTimingEvent => e.judgment !== "miss");
  const hitRate = hits.length / events.length;

  const deltas = hits.map((e) => Math.abs(e.deltaMs));
  const avgAbsDeltaMs =
    deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;

  return { hitRate, avgAbsDeltaMs: Math.round(avgAbsDeltaMs) };
}
