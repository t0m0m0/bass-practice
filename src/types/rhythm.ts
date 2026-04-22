import type { TimeSignature } from "./practice";

/**
 * A single step in a rhythm pattern.
 * `beat` is expressed in quarter-note units relative to the pattern start
 * (e.g. 0, 0.5, 1, 1.5... for straight eighths; 0, 0.667, 1, 1.667 for shuffle).
 */
export interface RhythmStep {
  beat: number;
  rest?: boolean;
  accent?: boolean;
  /** Display label shown under the step (e.g. "1", "&", "e", "a"). */
  label?: string;
}

export interface RhythmPattern {
  id: string;
  name: string;
  description: string;
  bpm: number;
  timeSignature: TimeSignature;
  measures: number;
  /** Grid subdivision used for display (e.g. 2 = eighths, 4 = sixteenths). */
  subdivision: number;
  steps: RhythmStep[];
}
