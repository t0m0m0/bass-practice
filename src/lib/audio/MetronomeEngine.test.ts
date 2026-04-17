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

const mockAudioContext = {
  currentTime: 0,
  destination: {},
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  close: vi.fn(),
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
    mockOscillator.frequency.value = 0;
    engine = new MetronomeEngine({ bpm: 120, beatsPerMeasure: 4, beatUnit: 4 });
  });

  afterEach(() => {
    engine.stop();
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

  it("starts and stops", async () => {
    await engine.start();
    expect(engine.isPlaying).toBe(true);
    expect(engine.context).not.toBeNull();

    engine.stop();
    expect(engine.isPlaying).toBe(false);
    expect(engine.context).toBeNull();
  });

  it("does not start twice", async () => {
    await engine.start();
    await engine.start();
    expect(engine.isPlaying).toBe(true);
  });

  it("fires beat callbacks via scheduler", async () => {
    const beatCb = vi.fn();
    engine.onBeat(beatCb);

    await engine.start();

    // Advance time so scheduler fires
    mockAudioContext.currentTime = 0.2;
    vi.advanceTimersByTime(30);

    expect(beatCb).toHaveBeenCalled();
    expect(beatCb.mock.calls[0][0]).toBe(0); // first beat
  });

  it("unsubscribes beat callback", async () => {
    const beatCb = vi.fn();
    const unsub = engine.onBeat(beatCb);
    unsub();

    await engine.start();
    mockAudioContext.currentTime = 0.2;
    vi.advanceTimersByTime(30);

    expect(beatCb).not.toHaveBeenCalled();
  });

  it("creates accent on first beat of measure", async () => {
    await engine.start();

    mockAudioContext.currentTime = 0.2;
    vi.advanceTimersByTime(30);

    // First beat should use 1000 Hz (accent)
    expect(mockOscillator.frequency.value).toBe(1000);
  });

  it("returns current time in ms", async () => {
    await engine.start();
    mockAudioContext.currentTime = 1.5;
    expect(engine.getCurrentTimeMs()).toBe(1500);
  });

  it("returns 0 for getCurrentTimeMs when not playing", () => {
    expect(engine.getCurrentTimeMs()).toBe(0);
  });
});
