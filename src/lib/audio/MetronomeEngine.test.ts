import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MetronomeEngine } from "./MetronomeEngine";

// Mock AudioContext
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { value: 0 },
};

const mockGain = {
  connect: vi.fn(),
  gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
};

const mockAudioContext: {
  currentTime: number;
  state: string;
  destination: object;
  createOscillator: () => typeof mockOscillator;
  createGain: () => typeof mockGain;
  close: () => Promise<void>;
  resume: () => Promise<void>;
} = {
  currentTime: 0,
  state: "running",
  destination: {},
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  close: vi.fn(async () => {
    mockAudioContext.state = "closed";
  }),
  resume: vi.fn(async () => {
    mockAudioContext.state = "running";
  }),
};

vi.stubGlobal(
  "AudioContext",
  function MockAudioContext() {
    return mockAudioContext;
  },
);

describe("MetronomeEngine", () => {
  let engine: MetronomeEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    mockAudioContext.currentTime = 0;
    mockAudioContext.state = "running";
    mockOscillator.frequency.value = 0;
    engine = new MetronomeEngine({ bpm: 120, beatsPerMeasure: 4, beatUnit: 4 });
  });

  afterEach(async () => {
    await engine.stop();
    vi.useRealTimers();
  });

  it("initializes with given options", () => {
    expect(engine.bpm).toBe(120);
    expect(engine.beatsPerMeasure).toBe(4);
    expect(engine.beatUnit).toBe(4);
    expect(engine.isPlaying).toBe(false);
  });

  it("clamps bpm between 20 and 300", () => {
    engine.bpm = 10;
    expect(engine.bpm).toBe(20);
    engine.bpm = 400;
    expect(engine.bpm).toBe(300);
    engine.bpm = 150;
    expect(engine.bpm).toBe(150);
  });

  it("clamps bpm passed via constructor", () => {
    const clamped = new MetronomeEngine({
      bpm: 1000,
      beatsPerMeasure: 4,
      beatUnit: 4,
    });
    expect(clamped.bpm).toBe(300);
  });

  it("throws on invalid beatsPerMeasure", () => {
    expect(
      () => new MetronomeEngine({ bpm: 120, beatsPerMeasure: 0, beatUnit: 4 }),
    ).toThrow(RangeError);
    expect(
      () => new MetronomeEngine({ bpm: 120, beatsPerMeasure: 1.5, beatUnit: 4 }),
    ).toThrow(RangeError);
    expect(() => {
      engine.beatsPerMeasure = 0;
    }).toThrow(RangeError);
  });

  it("starts and stops", async () => {
    await engine.start();
    expect(engine.isPlaying).toBe(true);
    expect(engine.context).not.toBeNull();

    await engine.stop();
    expect(engine.isPlaying).toBe(false);
    expect(engine.context).toBeNull();
  });

  it("awaits AudioContext.close() on stop", async () => {
    await engine.start();
    await engine.stop();
    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it("resumes a suspended AudioContext on start", async () => {
    mockAudioContext.state = "suspended";
    await engine.start();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it("does not start twice", async () => {
    await engine.start();
    const firstCallCount = (
      mockAudioContext.createOscillator as ReturnType<typeof vi.fn>
    ).mock.calls.length;
    await engine.start();
    // Second start() was a no-op: same AudioContext, no extra scheduler activity
    const secondCallCount = (
      mockAudioContext.createOscillator as ReturnType<typeof vi.fn>
    ).mock.calls.length;
    expect(secondCallCount).toBe(firstCallCount);
    expect(engine.isPlaying).toBe(true);
  });

  it("fires beat callbacks via scheduler", async () => {
    const beatCb = vi.fn();
    engine.onBeat(beatCb);

    await engine.start();

    // Advance time so scheduler fires
    mockAudioContext.currentTime = 0.2;
    await vi.advanceTimersByTimeAsync(30);

    expect(beatCb).toHaveBeenCalled();
    expect(beatCb.mock.calls[0][0]).toBe(0); // first beat
    expect(typeof beatCb.mock.calls[0][1]).toBe("number"); // scheduled time
  });

  it("unsubscribes beat callback", async () => {
    const beatCb = vi.fn();
    const unsub = engine.onBeat(beatCb);
    unsub();

    await engine.start();
    mockAudioContext.currentTime = 0.2;
    await vi.advanceTimersByTimeAsync(30);

    expect(beatCb).not.toHaveBeenCalled();
  });

  it("creates accent on first beat of measure", async () => {
    await engine.start();

    mockAudioContext.currentTime = 0.2;
    await vi.advanceTimersByTimeAsync(30);

    // First beat should use 1000 Hz (accent)
    expect(mockOscillator.frequency.value).toBe(1000);
  });

  it("returns current time in ms when playing", async () => {
    await engine.start();
    mockAudioContext.currentTime = 1.5;
    expect(engine.getCurrentTimeMs()).toBe(1500);
  });

  it("returns null for getCurrentTimeMs when not playing", () => {
    expect(engine.getCurrentTimeMs()).toBeNull();
  });
});
