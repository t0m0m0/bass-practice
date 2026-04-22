import { Scale, Note } from "tonal";
import type { FretPosition } from "../../types/music";

// Chromatic keys (sharp convention, matching tonal defaults used in this project)
export const KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export type Key = (typeof KEYS)[number];

// Curated scale list (matches issue requirements)
export const SCALE_TYPES = [
  { id: "major", label: "Major" },
  { id: "minor", label: "Natural Minor" },
  { id: "major pentatonic", label: "Major Pentatonic" },
  { id: "minor pentatonic", label: "Minor Pentatonic" },
  { id: "minor blues", label: "Blues" },
  { id: "dorian", label: "Dorian" },
  { id: "mixolydian", label: "Mixolydian" },
] as const;

export type ScaleTypeId = (typeof SCALE_TYPES)[number]["id"];

// Standard 4-string bass tuning (string 1 = G highest, string 4 = E lowest)
// Open-string notes with octave suffix
export const BASS_TUNING_OPEN_NOTES = ["G2", "D2", "A1", "E1"] as const;

export interface ScalePitchClasses {
  key: Key;
  type: ScaleTypeId;
  pitchClasses: string[]; // e.g. ["C", "D", "E", ...]
}

/**
 * Resolve the pitch classes of a scale (root first). Returns empty if invalid.
 * Uses tonal's Scale.get("<root> <type>").
 */
export function getScalePitchClasses(
  key: Key,
  type: ScaleTypeId,
): ScalePitchClasses {
  const s = Scale.get(`${key} ${type}`);
  const pcs = s.notes.map((n) => Note.pitchClass(n)).filter(Boolean);
  return { key, type, pitchClasses: pcs };
}

export function normalizePitchClass(pc: string): string {
  // Canonicalize to sharp-notation pitch class via MIDI round-trip.
  if (!pc) return pc;
  const midi = Note.midi(`${pc}4`);
  if (midi == null) return pc;
  return Note.pitchClass(Note.fromMidiSharps(midi));
}

/**
 * Returns true if the given pitch class is a member of the scale.
 * Both inputs are normalized to sharp enharmonics.
 */
export function isPitchClassInScale(
  pitchClass: string,
  scalePitchClasses: string[],
): boolean {
  if (!pitchClass) return false;
  const target = normalizePitchClass(pitchClass);
  return scalePitchClasses.some((pc) => normalizePitchClass(pc) === target);
}

/**
 * Compute all fret positions on a 4-string bass where a scale note occurs,
 * within the given fret range (inclusive).
 */
export function getScaleFretPositions(
  scalePitchClasses: string[],
  startFret: number,
  endFret: number,
): FretPosition[] {
  const positions: FretPosition[] = [];
  const normalizedScale = scalePitchClasses.map(normalizePitchClass);

  for (let s = 0; s < BASS_TUNING_OPEN_NOTES.length; s++) {
    const openMidi = Note.midi(BASS_TUNING_OPEN_NOTES[s]);
    if (openMidi == null) continue;
    for (let fret = startFret; fret <= endFret; fret++) {
      const midi = openMidi + fret;
      const note = Note.fromMidiSharps(midi);
      const pc = Note.pitchClass(note);
      if (normalizedScale.includes(normalizePitchClass(pc))) {
        const freq = Note.freq(note);
        if (freq == null) continue;
        positions.push({
          string: s + 1,
          fret,
          note,
          pitchClass: pc,
          frequency: freq,
        });
      }
    }
  }
  return positions;
}

/**
 * Build an ascending-then-descending target sequence across one octave,
 * starting from the lowest scale note playable from the given start fret
 * on the 4th string.
 */
export function buildAscDescSequence(
  scalePitchClasses: string[],
  startOctave = 1,
): string[] {
  if (scalePitchClasses.length === 0) return [];
  const root = scalePitchClasses[0];
  // Build one octave: roots first-note -> up through scale -> octave root
  const asc: string[] = scalePitchClasses.map((pc) => {
    // Assign each pc to an octave so they ascend monotonically
    const base = `${pc}${startOctave}`;
    const midi = Note.midi(base);
    const rootMidi = Note.midi(`${root}${startOctave}`) ?? 0;
    if (midi == null) return base;
    const adjusted = midi < rootMidi ? midi + 12 : midi;
    return Note.fromMidiSharps(adjusted);
  });
  const octaveRootMidi = (Note.midi(`${root}${startOctave}`) ?? 0) + 12;
  const octaveRoot = Note.fromMidiSharps(octaveRootMidi);
  asc.push(octaveRoot);

  const desc = [...asc].slice(0, -1).reverse();
  return [...asc, ...desc];
}
