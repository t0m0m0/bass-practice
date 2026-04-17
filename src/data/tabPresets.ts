import type { TabPreset } from "../types/practice";

export const tabPresets: TabPreset[] = [
  {
    id: "c-major-scale",
    name: "C Major Scale",
    description: "基本のCメジャースケール。ゆっくりしたテンポで指の動きを確認しよう。",
    bpm: 80,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 2,
    notes: [
      // Measure 1: C D E F (quarter notes on beats 0,1,2,3)
      { string: 3, fret: 3, beat: 0, label: "C" },
      { string: 3, fret: 5, beat: 1, label: "D" },
      { string: 2, fret: 2, beat: 2, label: "E" },
      { string: 2, fret: 3, beat: 3, label: "F" },
      // Measure 2: G A B C (quarter notes on beats 4,5,6,7)
      { string: 2, fret: 5, beat: 4, label: "G" },
      { string: 1, fret: 2, beat: 5, label: "A" },
      { string: 1, fret: 4, beat: 6, label: "B" },
      { string: 1, fret: 5, beat: 7, label: "C" },
    ],
  },
  {
    id: "blues-bassline",
    name: "Blues Bassline",
    description: "12小節ブルースの最初の4小節。シャッフルフィールを意識して。",
    bpm: 100,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 4,
    notes: [
      // Measure 1: E root pattern
      { string: 4, fret: 0, beat: 0, label: "E" },
      { string: 4, fret: 0, beat: 1, label: "E" },
      { string: 4, fret: 4, beat: 2, label: "G#" },
      { string: 4, fret: 0, beat: 3, label: "E" },
      // Measure 2
      { string: 4, fret: 0, beat: 4, label: "E" },
      { string: 4, fret: 0, beat: 5, label: "E" },
      { string: 4, fret: 4, beat: 6, label: "G#" },
      { string: 4, fret: 0, beat: 7, label: "E" },
      // Measure 3: A
      { string: 3, fret: 0, beat: 8, label: "A" },
      { string: 3, fret: 0, beat: 9, label: "A" },
      { string: 3, fret: 4, beat: 10, label: "C#" },
      { string: 3, fret: 0, beat: 11, label: "A" },
      // Measure 4: E
      { string: 4, fret: 0, beat: 12, label: "E" },
      { string: 4, fret: 0, beat: 13, label: "E" },
      { string: 4, fret: 4, beat: 14, label: "G#" },
      { string: 4, fret: 0, beat: 15, label: "E" },
    ],
  },
  {
    id: "waltz-pattern",
    name: "Waltz Pattern",
    description: "3/4拍子のワルツパターン。1拍目のアクセントを大切に。",
    bpm: 90,
    timeSignature: { beatsPerMeasure: 3, beatUnit: 4 },
    measures: 4,
    notes: [
      // Measure 1: C
      { string: 3, fret: 3, beat: 0, label: "C" },
      { string: 2, fret: 2, beat: 1, label: "E" },
      { string: 1, fret: 0, beat: 2, label: "G" },
      // Measure 2: F
      { string: 4, fret: 1, beat: 3, label: "F" },
      { string: 3, fret: 0, beat: 4, label: "A" },
      { string: 2, fret: 3, beat: 5, label: "C" },
      // Measure 3: G
      { string: 4, fret: 3, beat: 6, label: "G" },
      { string: 3, fret: 2, beat: 7, label: "B" },
      { string: 2, fret: 0, beat: 8, label: "D" },
      // Measure 4: C
      { string: 3, fret: 3, beat: 9, label: "C" },
      { string: 2, fret: 2, beat: 10, label: "E" },
      { string: 1, fret: 0, beat: 11, label: "G" },
    ],
  },
];
