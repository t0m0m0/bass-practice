import { describe, it, expect } from "vitest";
import {
  BASS_OPEN_STRING_MIDI,
  midiToFrequency,
  expectedFrequencyForNote,
  centsBetween,
  foldCentsToPitchClass,
  judgePitch,
} from "./pitchEvaluator";

describe("midiToFrequency", () => {
  it("A4 = 440Hz", () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 3);
  });
  it("E1 ≈ 41.2Hz", () => {
    expect(midiToFrequency(28)).toBeCloseTo(41.2, 1);
  });
});

describe("expectedFrequencyForNote", () => {
  it("open E string (string 4, fret 0) ≈ 41.2Hz", () => {
    expect(expectedFrequencyForNote({ string: 4, fret: 0, beat: 0 }))!
      .toBeCloseTo(41.2, 1);
  });

  it("open A string (string 3, fret 0) ≈ 55Hz", () => {
    expect(expectedFrequencyForNote({ string: 3, fret: 0, beat: 0 }))!
      .toBeCloseTo(55, 1);
  });

  it("A string 5th fret = D2 (same as open D) ≈ 73.4Hz", () => {
    const dFromA = expectedFrequencyForNote({ string: 3, fret: 5, beat: 0 });
    const openD = expectedFrequencyForNote({ string: 2, fret: 0, beat: 0 });
    expect(dFromA).toBeCloseTo(openD!, 3);
    expect(dFromA).toBeCloseTo(73.4, 1);
  });

  it("open G string (string 1, fret 0) ≈ 98Hz", () => {
    expect(expectedFrequencyForNote({ string: 1, fret: 0, beat: 0 }))!
      .toBeCloseTo(98, 1);
  });

  it("returns null for unknown string", () => {
    expect(expectedFrequencyForNote({ string: 9, fret: 0, beat: 0 })).toBeNull();
  });

  it("covers all 4 strings", () => {
    expect(Object.keys(BASS_OPEN_STRING_MIDI)).toHaveLength(4);
  });
});

describe("centsBetween", () => {
  it("0 for identical frequencies", () => {
    expect(centsBetween(440, 440)).toBeCloseTo(0, 6);
  });
  it("+1200 for one octave up", () => {
    expect(centsBetween(880, 440)).toBeCloseTo(1200, 3);
  });
  it("-1200 for one octave down", () => {
    expect(centsBetween(220, 440)).toBeCloseTo(-1200, 3);
  });
  it("returns null on invalid inputs", () => {
    expect(centsBetween(0, 440)).toBeNull();
    expect(centsBetween(440, 0)).toBeNull();
    expect(centsBetween(-10, 440)).toBeNull();
  });
});

describe("foldCentsToPitchClass", () => {
  it("leaves small offsets unchanged", () => {
    expect(foldCentsToPitchClass(30)).toBe(30);
    expect(foldCentsToPitchClass(-30)).toBe(-30);
  });
  it("folds one octave up to 0", () => {
    expect(foldCentsToPitchClass(1200)).toBe(0);
  });
  it("folds 1250 cents to 50", () => {
    expect(foldCentsToPitchClass(1250)).toBeCloseTo(50, 6);
  });
  it("folds -1250 cents to -50", () => {
    expect(foldCentsToPitchClass(-1250)).toBeCloseTo(-50, 6);
  });
});

describe("judgePitch", () => {
  const tol = 50;

  it("returns null if either freq missing", () => {
    expect(judgePitch(null, 440, tol)).toBeNull();
    expect(judgePitch(440, null, tol)).toBeNull();
  });

  it("marks exact match correct", () => {
    const r = judgePitch(440, 440, tol)!;
    expect(r.correct).toBe(true);
    expect(r.pitchCents).toBe(0);
  });

  it("marks within tolerance correct", () => {
    const r = judgePitch(440 * Math.pow(2, 40 / 1200), 440, tol)!;
    expect(r.correct).toBe(true);
  });

  it("marks outside tolerance incorrect", () => {
    const r = judgePitch(440 * Math.pow(2, 80 / 1200), 440, tol)!;
    expect(r.correct).toBe(false);
  });

  it("octave-confused detection is considered correct (pitch-class match)", () => {
    // Pitchy often drops an octave for low bass notes.
    const r = judgePitch(220, 440, tol)!;
    expect(r.correct).toBe(true);
    expect(r.pitchCents).toBe(0);
  });
});
