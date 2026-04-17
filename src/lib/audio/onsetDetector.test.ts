import { describe, it, expect, beforeEach } from "vitest";
import { OnsetDetector } from "./onsetDetector";

function makeBuffer(rms: number, length = 1024): Float32Array {
  // Create a buffer where the RMS equals the desired value
  const amplitude = rms; // For constant signal, RMS = amplitude
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = amplitude;
  }
  return buffer;
}

describe("OnsetDetector", () => {
  let detector: OnsetDetector;

  beforeEach(() => {
    detector = new OnsetDetector({ rmsThreshold: 0.02, minIntervalMs: 80 });
  });

  it("detects onset when RMS exceeds threshold", () => {
    const result = detector.process(makeBuffer(0.05), 100);
    expect(result).not.toBeNull();
    expect(result!.timeMs).toBe(100);
    expect(result!.rms).toBeCloseTo(0.05, 2);
  });

  it("returns null when RMS is below threshold", () => {
    const result = detector.process(makeBuffer(0.01), 100);
    expect(result).toBeNull();
  });

  it("does not re-trigger while above threshold (hysteresis)", () => {
    const first = detector.process(makeBuffer(0.05), 100);
    expect(first).not.toBeNull();

    // Still above threshold - should not trigger again
    const second = detector.process(makeBuffer(0.05), 200);
    expect(second).toBeNull();
  });

  it("re-triggers after signal drops below release threshold", () => {
    detector.process(makeBuffer(0.05), 100);

    // Drop below release threshold (0.02 * 0.5 = 0.01)
    detector.process(makeBuffer(0.005), 200);

    // Rise again
    const result = detector.process(makeBuffer(0.05), 300);
    expect(result).not.toBeNull();
    expect(result!.timeMs).toBe(300);
  });

  it("respects minimum interval", () => {
    detector.process(makeBuffer(0.05), 100);

    // Drop below release
    detector.process(makeBuffer(0.005), 120);

    // Try to trigger again too soon (< 80ms from last onset at 100)
    const result = detector.process(makeBuffer(0.05), 160);
    expect(result).toBeNull();
  });

  it("allows re-trigger after minimum interval", () => {
    detector.process(makeBuffer(0.05), 100);

    // Drop below release
    detector.process(makeBuffer(0.005), 150);

    // Trigger after minimum interval
    const result = detector.process(makeBuffer(0.05), 200);
    expect(result).not.toBeNull();
  });

  it("handles empty buffer", () => {
    const result = detector.process(new Float32Array(0), 100);
    expect(result).toBeNull();
  });

  it("resets state", () => {
    detector.process(makeBuffer(0.05), 100);
    detector.reset();

    // Should trigger immediately after reset
    const result = detector.process(makeBuffer(0.05), 110);
    expect(result).not.toBeNull();
  });

  it("allows threshold adjustment", () => {
    detector.setThreshold(0.1);
    const result = detector.process(makeBuffer(0.05), 100);
    expect(result).toBeNull(); // below new threshold

    const result2 = detector.process(makeBuffer(0.15), 200);
    expect(result2).not.toBeNull();
  });

  it("time-based re-arm: releases after releaseTimeoutMs when signal is in mid-range", () => {
    // releaseTimeoutMs default = 200ms; threshold = 0.02, release floor = 0.01.
    // A slowly-decaying bass note stays in [0.01, 0.02) forever without either
    // hysteresis branch firing — time-based re-arm handles that.
    const d = new OnsetDetector({
      rmsThreshold: 0.02,
      releaseTimeoutMs: 200,
    });
    expect(d.process(makeBuffer(0.05), 0)).not.toBeNull();
    // Mid-range: doesn't cross release floor
    expect(d.process(makeBuffer(0.015), 100)).toBeNull();
    expect(d.process(makeBuffer(0.015), 250)).toBeNull();
    // After timeout elapsed and mid-range seen, next above-threshold fires
    const onset = d.process(makeBuffer(0.05), 300);
    expect(onset).not.toBeNull();
    expect(onset!.timeMs).toBe(300);
  });
});
