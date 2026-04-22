import type { RhythmPattern } from "../../types/rhythm";
import type { TabNote, TabPreset } from "../../types/practice";

/**
 * Convert a RhythmPattern to a TabPreset so it can be driven by the
 * existing useTabPractice timing machinery.
 *
 * Pitch is irrelevant for rhythm practice — we map every step to the open
 * E string (string 4, fret 0) as a canonical mute/open-string onset target.
 * Rests are dropped (they are not timing targets). The display layer uses
 * the original RhythmPattern, not this preset.
 */
export function rhythmPatternToTabPreset(pattern: RhythmPattern): TabPreset {
  const notes: TabNote[] = pattern.steps
    .filter((s) => !s.rest)
    .map((s) => ({
      string: 4,
      fret: 0,
      beat: s.beat,
      label: s.label,
    }));

  return {
    id: pattern.id,
    name: pattern.name,
    description: pattern.description,
    bpm: pattern.bpm,
    timeSignature: pattern.timeSignature,
    measures: pattern.measures,
    notes,
  };
}
