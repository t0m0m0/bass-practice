import { describe, it, expect } from "vitest";
import {
  getScalePitchClasses,
  isPitchClassInScale,
  getScaleFretPositions,
  buildAscDescSequence,
  normalizePitchClass,
} from "./scales";

describe("scales", () => {
  it("C major -> 7 notes starting at C", () => {
    const s = getScalePitchClasses("C", "major");
    expect(s.pitchClasses).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
  });

  it("A minor pentatonic -> 5 notes", () => {
    const s = getScalePitchClasses("A", "minor pentatonic");
    expect(s.pitchClasses.length).toBe(5);
    expect(s.pitchClasses[0]).toBe("A");
  });

  it("isPitchClassInScale handles enharmonic equivalents", () => {
    const s = getScalePitchClasses("F", "major"); // includes Bb
    expect(isPitchClassInScale("A#", s.pitchClasses)).toBe(true);
    expect(isPitchClassInScale("B", s.pitchClasses)).toBe(false);
  });

  it("getScaleFretPositions returns positions across 4 strings", () => {
    const s = getScalePitchClasses("C", "major");
    const pos = getScaleFretPositions(s.pitchClasses, 0, 5);
    expect(pos.length).toBeGreaterThan(0);
    for (const p of pos) {
      expect(p.string).toBeGreaterThanOrEqual(1);
      expect(p.string).toBeLessThanOrEqual(4);
      expect(p.fret).toBeGreaterThanOrEqual(0);
      expect(p.fret).toBeLessThanOrEqual(5);
    }
    // E at open 4th string should be a member of C major
    expect(
      pos.some((p) => p.string === 4 && p.fret === 0 && p.pitchClass === "E"),
    ).toBe(true);
    // F at fret 1 of 4th string
    expect(
      pos.some((p) => p.string === 4 && p.fret === 1 && p.pitchClass === "F"),
    ).toBe(true);
  });

  it("normalizePitchClass converts flats to sharps", () => {
    expect(normalizePitchClass("Bb")).toBe("A#");
    expect(normalizePitchClass("Eb")).toBe("D#");
    expect(normalizePitchClass("A#")).toBe("A#");
    expect(normalizePitchClass("C")).toBe("C");
  });

  it("buildAscDescSequence ascends then descends an octave", () => {
    const s = getScalePitchClasses("C", "major");
    const seq = buildAscDescSequence(s.pitchClasses, 2);
    // 7 notes + octave root + descending (without top dup) = 15
    expect(seq.length).toBe(15);
    expect(seq[0]).toBe("C2");
    expect(seq[7]).toBe("C3");
    expect(seq[seq.length - 1]).toBe("C2");
  });
});
