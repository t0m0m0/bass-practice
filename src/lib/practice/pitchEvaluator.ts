import type { TabNote } from "../../types/practice";

/**
 * Open-string MIDI numbers for 4-string bass standard tuning.
 * string 1 = G2 (MIDI 43, highest) ... string 4 = E1 (MIDI 28, lowest)
 */
export const BASS_OPEN_STRING_MIDI: Record<number, number> = {
  1: 43, // G2
  2: 38, // D2
  3: 33, // A1
  4: 28, // E1
};

const A4_FREQUENCY = 440;
const A4_MIDI = 69;

export function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12);
}

/**
 * Expected fundamental frequency for a given tab note on 4-string bass.
 * Returns null if the string number is unknown.
 */
export function expectedFrequencyForNote(note: TabNote): number | null {
  const openMidi = BASS_OPEN_STRING_MIDI[note.string];
  if (openMidi === undefined) return null;
  return midiToFrequency(openMidi + note.fret);
}

/**
 * Cents between a detected frequency and an expected frequency.
 * Positive = detected is sharp, negative = flat.
 * If either frequency is invalid (<=0), returns null.
 */
export function centsBetween(
  detectedHz: number,
  expectedHz: number,
): number | null {
  if (!(detectedHz > 0) || !(expectedHz > 0)) return null;
  return 1200 * Math.log2(detectedHz / expectedHz);
}

/**
 * Fold a cent offset to its nearest pitch-class equivalent in [-600, 600).
 * This lets octave-confused detections (e.g. pitchy returning half/double
 * the intended frequency) still be recognised as correct pitch class.
 */
export function foldCentsToPitchClass(cents: number): number {
  let folded = ((cents + 600) % 1200 + 1200) % 1200 - 600;
  // Guarantee the canonical range (JS modulo on -600 edge case)
  if (folded >= 600) folded -= 1200;
  return folded;
}

export interface PitchJudgeResult {
  /** signed cents offset (pitch-class folded) */
  pitchCents: number;
  /** true if within the tolerance window */
  correct: boolean;
}

/**
 * Judge a detected frequency against an expected frequency.
 * Returns null if either frequency is missing / invalid.
 */
export function judgePitch(
  detectedHz: number | null,
  expectedHz: number | null,
  toleranceCents: number,
): PitchJudgeResult | null {
  if (detectedHz == null || expectedHz == null) return null;
  const raw = centsBetween(detectedHz, expectedHz);
  if (raw == null) return null;
  const folded = foldCentsToPitchClass(raw);
  return {
    pitchCents: Math.round(folded),
    correct: Math.abs(folded) <= toleranceCents,
  };
}
