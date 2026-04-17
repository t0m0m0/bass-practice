import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMetronome } from "./useMetronome";

type BeatCallback = (beat: number, time: number) => void;

// Mock MetronomeEngine
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockGetCurrentTimeMs = vi.fn<() => number | null>(() => 1000);
let mockBpm = 120;
let mockIsPlaying = false;
let engineBeatCallback: BeatCallback | null = null;

vi.mock("../lib/audio/MetronomeEngine", () => ({
  MetronomeEngine: class MockMetronomeEngine {
    start = mockStart.mockImplementation(async () => {
      mockIsPlaying = true;
    });
    stop = mockStop.mockImplementation(async () => {
      mockIsPlaying = false;
    });
    initContext = vi.fn();
    onBeat = vi.fn((cb: BeatCallback) => {
      engineBeatCallback = cb;
      return () => {
        if (engineBeatCallback === cb) engineBeatCallback = null;
      };
    });
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
    engineBeatCallback = null;
    mockGetCurrentTimeMs.mockImplementation(() => 1000);
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

    await act(async () => {
      await result.current.stop();
    });

    expect(mockStop).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it("propagates errors from engine.start() without marking isPlaying", async () => {
    mockStart.mockImplementationOnce(async () => {
      throw new Error("permission denied");
    });
    const { result } = renderHook(() => useMetronome(120, 4, 4));

    await expect(
      act(async () => {
        await result.current.start();
      }),
    ).rejects.toThrow("permission denied");

    expect(result.current.isPlaying).toBe(false);
  });

  it("updates bpm", () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));

    act(() => {
      result.current.setBpm(140);
    });

    expect(result.current.bpm).toBe(140);
  });

  it("returns null from getCurrentTimeMs before start, engine time after", async () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));

    expect(result.current.getCurrentTimeMs()).toBeNull();

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.getCurrentTimeMs()).toBe(1000);
  });

  it("invokes the external onBeat callback when the engine fires a beat", async () => {
    const { result } = renderHook(() => useMetronome(120, 4, 4));
    const cb = vi.fn();

    act(() => {
      result.current.onBeat(cb);
    });

    await act(async () => {
      await result.current.start();
    });

    act(() => {
      engineBeatCallback?.(3, 1.25);
    });

    expect(cb).toHaveBeenCalledWith(3, 1.25);
    expect(result.current.currentBeat).toBe(3);
  });
});
