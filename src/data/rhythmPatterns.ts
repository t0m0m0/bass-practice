import type { RhythmPattern } from "../types/rhythm";

/**
 * Generate labels "1 e & a 2 e & a ..." for 16th-note grids,
 * or "1 & 2 & ..." for 8th-note grids.
 */
function labelFor(beat: number, subdivision: number, beatsPerMeasure: number): string {
  const beatInMeasure = beat % beatsPerMeasure;
  const beatInt = Math.floor(beatInMeasure);
  const frac = beatInMeasure - beatInt;
  if (subdivision === 4) {
    const idx = Math.round(frac * 4);
    return [`${beatInt + 1}`, "e", "&", "a"][idx] ?? "";
  }
  if (subdivision === 2) {
    return frac < 0.25 ? `${beatInt + 1}` : "&";
  }
  return `${beatInt + 1}`;
}

export const rhythmPatterns: RhythmPattern[] = [
  {
    id: "eighth-straight",
    name: "8分音符ストレート",
    description: "表裏を等間隔で。メトロノームの「&」に遅れないように。",
    bpm: 90,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 2,
    subdivision: 2,
    steps: Array.from({ length: 16 }, (_, i) => {
      const beat = i * 0.5;
      return { beat, label: labelFor(beat, 2, 4) };
    }),
  },
  {
    id: "eighth-shuffle",
    name: "8分音符シャッフル",
    description: "3連符の1・3に乗るシャッフル。ハネすぎ・詰めすぎに注意。",
    bpm: 90,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 2,
    subdivision: 2,
    steps: Array.from({ length: 8 }, (_, i) => i).flatMap((beatInt) => [
      { beat: beatInt, label: `${(beatInt % 4) + 1}` },
      // Shuffle "&" lands 2/3 into the beat (last partial of a triplet).
      { beat: beatInt + 2 / 3, label: "&" },
    ]),
  },
  {
    id: "sixteenth-straight",
    name: "16分音符",
    description: "4分割で正確に。右手（ピッキング）の粒を揃えよう。",
    bpm: 70,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 1,
    subdivision: 4,
    steps: Array.from({ length: 16 }, (_, i) => {
      const beat = i * 0.25;
      return { beat, label: labelFor(beat, 4, 4) };
    }),
  },
  {
    id: "syncopation-offbeat",
    name: "シンコペーション",
    description: "裏拍にアクセント。表を休符にして、裏を強く当てる感覚を鍛える。",
    bpm: 90,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 2,
    subdivision: 2,
    steps: Array.from({ length: 8 }, (_, i) => i).flatMap((beatInt) => [
      { beat: beatInt, rest: true, label: `${(beatInt % 4) + 1}` },
      { beat: beatInt + 0.5, accent: true, label: "&" },
    ]),
  },
  {
    id: "rest-pattern",
    name: "休符を含むパターン",
    description: "1・2&・4のリズム。休符でミュートする練習に。",
    bpm: 85,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 2,
    subdivision: 2,
    steps: [
      // Per measure: hit 1, rest 1&, hit 2, hit 2&, rest 3, rest 3&, hit 4, rest 4&
      ...[0, 4].flatMap((base) => [
        { beat: base + 0, label: "1" },
        { beat: base + 0.5, rest: true, label: "&" },
        { beat: base + 1, label: "2" },
        { beat: base + 1.5, label: "&" },
        { beat: base + 2, rest: true, label: "3" },
        { beat: base + 2.5, rest: true, label: "&" },
        { beat: base + 3, label: "4" },
        { beat: base + 3.5, rest: true, label: "&" },
      ]),
    ],
  },
];
