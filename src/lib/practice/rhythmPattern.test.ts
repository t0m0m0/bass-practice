import { describe, it, expect } from "vitest";
import { rhythmPatternToTabPreset } from "./rhythmPattern";
import type { RhythmPattern } from "../../types/rhythm";

const base: RhythmPattern = {
  id: "t",
  name: "t",
  description: "",
  bpm: 90,
  timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
  measures: 1,
  subdivision: 2,
  steps: [
    { beat: 0, label: "1" },
    { beat: 0.5, rest: true, label: "&" },
    { beat: 1, accent: true, label: "2" },
    { beat: 2, label: "3" },
  ],
};

describe("rhythmPatternToTabPreset", () => {
  it("drops rests and maps steps to open E onsets", () => {
    const preset = rhythmPatternToTabPreset(base);
    expect(preset.notes).toHaveLength(3);
    expect(preset.notes.every((n) => n.string === 4 && n.fret === 0)).toBe(true);
    expect(preset.notes.map((n) => n.beat)).toEqual([0, 1, 2]);
  });

  it("preserves preset metadata", () => {
    const preset = rhythmPatternToTabPreset(base);
    expect(preset.id).toBe("t");
    expect(preset.bpm).toBe(90);
    expect(preset.timeSignature).toEqual({ beatsPerMeasure: 4, beatUnit: 4 });
    expect(preset.measures).toBe(1);
  });
});
