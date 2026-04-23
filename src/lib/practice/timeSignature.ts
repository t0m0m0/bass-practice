import type { TimeSignature } from "../../types/practice";

/**
 * Beat units currently supported by the metronome / timing engine.
 *
 * The scheduling logic in `MetronomeEngine` and the target-time math in
 * `timingEvaluator.buildTimingTargets` both assume the beat is a quarter
 * note (i.e. `60 / bpm` seconds per beat, measuring tempo in quarter-note
 * BPM). Until we add proper beat-unit scaling, only `x/4` meters behave
 * consistently between the UI and the engine.
 *
 * Keep this list as a single source of truth so editor validation and
 * preset validation agree on what's permitted.
 */
export const SUPPORTED_BEAT_UNITS = [4] as const;
export type SupportedBeatUnit = (typeof SUPPORTED_BEAT_UNITS)[number];

export function isSupportedBeatUnit(value: number): value is SupportedBeatUnit {
  return (SUPPORTED_BEAT_UNITS as readonly number[]).includes(value);
}

export function assertSupportedBeatUnit(value: number): void {
  if (!isSupportedBeatUnit(value)) {
    throw new RangeError(
      `beatUnit ${value} is not supported. Supported: ${SUPPORTED_BEAT_UNITS.join(", ")}`,
    );
  }
}

export function isSupportedTimeSignature(ts: TimeSignature): boolean {
  return (
    Number.isInteger(ts.beatsPerMeasure) &&
    ts.beatsPerMeasure >= 1 &&
    isSupportedBeatUnit(ts.beatUnit)
  );
}
