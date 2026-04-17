import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMetronome } from "./useMetronome";

// Mock MetronomeEngine
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockOnBeat = vi.fn(() => vi.fn());
const mockGetCurrentTimeMs = vi.fn(() => 1000);
let mockBpm = 120;
let mockIsPlaying = false;

vi.mock("../lib/audio/MetronomeEngine", () => ({
  MetronomeEngine: class MockMetronomeEngine {
    constructor() {
      // reset per instantiation
    }
    start = mockStart.mockImplementation(async () => {
      mockIsPlaying = true;
    });
    stop = mockStop.mockImplementation(() => {
      mockIsPlaying = false;
    });
    onBeat = mockOnBeat;
    getCurrentTimeMs = mockGetCurrentTimeMs;
    get bpm() {
      return mockBpm;
    }
    set bpm(v: number) {
      mockBpm = v;
    }
    get isPlaying() {
      return mockIsPlaying;
    }
  },
}));

describe("useMetronome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBpm = 120;
    mockIsPlaying = false;
  });

  it("initializes with given bpm", () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));
    expect(result.current.bpm).toBe(120);
    expect(result.current.isPlaying).toBe(false);
  });

  it("starts the metronome", async () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));

    await act(async () => {
      await result.current.start();
    });

    expect(mockStart).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
  });

  it("stops the metronome", async () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      result.current.stop();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it("updates bpm", () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));

    act(() => {
      result.current.setBpm(140);
    });

    expect(result.current.bpm).toBe(140);
  });

  it("returns getCurrentTimeMs from engine ref", async () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));

    // Before start, engine is null, so should return 0
    expect(result.current.getCurrentTimeMs()).toBe(0);

    await act(async () => {
      await result.current.start();
    });

    // After start, should delegate to engine
    expect(result.current.getCurrentTimeMs()).toBe(1000);
  });

  it("registers onBeat callback", () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));
    const cb = vi.fn();

    act(() => {
      result.current.onBeat(cb);
    });

    // The callback is stored in a ref internally
    // It will be invoked when MetronomeEngine fires its onBeat
  });
});
