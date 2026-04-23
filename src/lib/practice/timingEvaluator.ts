import type {
  TimingEvent,
  TabNote,
  HitTimingEvent,
  MissTimingEvent,
} from "../../types/practice";
import { expectedFrequencyForNote } from "./pitchEvaluator";

const HIT_WINDOW_MS = 100;

export interface TimingTarget {
  beat: number;
  timeMs: number;
  /** Expected frequencies of notes at this beat (first note of each string). */
  expectedFrequencies: number[];
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
  const notesByBeat = new Map<number, TabNote[]>();
  for (const n of notes) {
    const arr = notesByBeat.get(n.beat) ?? [];
    arr.push(n);
    notesByBeat.set(n.beat, arr);
  }
  return [...notesByBeat.keys()]
    .sort((a, b) => a - b)
    .map((beat) => {
      const freqs = (notesByBeat.get(beat) ?? [])
        .map(expectedFrequencyForNote)
        .filter((f): f is number => f != null);
      return {
        beat,
        timeMs: startTimeMs + beat * msPerBeat,
        expectedFrequencies: freqs,
      };
    });
}

/**
 * Match an onset time to the nearest target beat.
 * Returns the TimingEvent or null if no target is within the hit window.
 *
 * Pitch fields are initialised to null here; the caller fills them in
 * once a stable pitch sample is available after the onset.
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
    expectedFrequency: closest.expectedFrequencies[0] ?? null,
    detectedFrequency: null,
    pitchCents: null,
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

export interface TimingStats {
  hitRate: number;
  avgAbsDeltaMs: number;
  /** Fraction of judged hits whose pitch was correct. 0 if no pitch data. */
  pitchAccuracy: number;
  /** Average absolute cents offset across pitch-judged hits. */
  avgAbsCents: number;
  /** Number of hits with pitch info (for stat confidence). */
  pitchJudgedCount: number;
}

/**
 * Compute summary stats from timing events.
 */
export function computeStats(events: TimingEvent[]): TimingStats {
  if (events.length === 0)
    return {
      hitRate: 0,
      avgAbsDeltaMs: 0,
      pitchAccuracy: 0,
      avgAbsCents: 0,
      pitchJudgedCount: 0,
    };

  const hits = events.filter(
    (e): e is HitTimingEvent => e.judgment !== "miss",
  );
  const hitRate = hits.length / events.length;

  const deltas = hits.map((e) => Math.abs(e.deltaMs));
  const avgAbsDeltaMs =
    deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;

  // Only on-time hits (perfect / timing-only) participate in pitch accuracy;
  // early/late are excluded from both numerator and denominator so "音程
  // 精度" reflects 「タイミング正解した中での音程正解率」.
  const pitchJudged = hits.filter(
    (e) =>
      e.pitchCents != null &&
      (e.judgment === "perfect" || e.judgment === "timing-only"),
  );
  const pitchCorrect = pitchJudged.filter(
    (e) => e.judgment === "perfect",
  ).length;
  const pitchAccuracy =
    pitchJudged.length > 0 ? pitchCorrect / pitchJudged.length : 0;
  const absCents = pitchJudged.map((e) => Math.abs(e.pitchCents as number));
  const avgAbsCents =
    absCents.length > 0
      ? absCents.reduce((a, b) => a + b, 0) / absCents.length
      : 0;

  return {
    hitRate,
    avgAbsDeltaMs: Math.round(avgAbsDeltaMs),
    pitchAccuracy,
    avgAbsCents: Math.round(avgAbsCents),
    pitchJudgedCount: pitchJudged.length,
  };
}
