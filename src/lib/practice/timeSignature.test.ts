import { describe, it, expect } from "vitest";
import {
  SUPPORTED_BEAT_UNITS,
  isSupportedBeatUnit,
  assertSupportedBeatUnit,
  isSupportedTimeSignature,
} from "./timeSignature";

describe("timeSignature support", () => {
  it("exposes 4 as the only supported beat unit", () => {
    expect(SUPPORTED_BEAT_UNITS).toEqual([4]);
  });

  it("accepts quarter-note beat", () => {
    expect(isSupportedBeatUnit(4)).toBe(true);
  });

  it("rejects 8/2/1/etc", () => {
    expect(isSupportedBeatUnit(8)).toBe(false);
    expect(isSupportedBeatUnit(2)).toBe(false);
    expect(isSupportedBeatUnit(16)).toBe(false);
  });

  it("assertSupportedBeatUnit throws on unsupported", () => {
    expect(() => assertSupportedBeatUnit(8)).toThrow(RangeError);
    expect(() => assertSupportedBeatUnit(4)).not.toThrow();
  });

  it("validates full TimeSignature objects", () => {
    expect(isSupportedTimeSignature({ beatsPerMeasure: 4, beatUnit: 4 })).toBe(true);
    expect(isSupportedTimeSignature({ beatsPerMeasure: 3, beatUnit: 4 })).toBe(true);
    expect(isSupportedTimeSignature({ beatsPerMeasure: 6, beatUnit: 8 })).toBe(false);
    expect(isSupportedTimeSignature({ beatsPerMeasure: 0, beatUnit: 4 })).toBe(false);
    expect(isSupportedTimeSignature({ beatsPerMeasure: 1.5, beatUnit: 4 })).toBe(false);
  });
});
