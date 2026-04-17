import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTabPractice } from "./useTabPractice";
import type { TabPreset } from "../types/practice";

type BeatCallback = (beat: number, time: number) => void;

// Module-level state shared between the mock and the test so we can drive
// beat callbacks synthetically.
const mockStart = vi.fn(async () => {});
const mockStop = vi.fn(async () => {});
let engineBeatCallback: BeatCallback | null = null;
let mockBpm = 120;
let mockIsPlaying = false;
let mockTimeMs: number | null = null;

vi.mock("../lib/audio/MetronomeEngine", () => ({
  MetronomeEngine: class {
    start = mockStart.mockImplementation(async () => {
      mockIsPlaying = true;
      mockTimeMs = 0;
    });
    stop = mockStop.mockImplementation(async () => {
      mockIsPlaying = false;
      mockTimeMs = null;
    });
    onBeat = (cb: BeatCallback) => {
      engineBeatCallback = cb;
      return () => {
        if (engineBeatCallback === cb) engineBeatCallback = null;
      };
    };
    getCurrentTimeMs = (): number | null => mockTimeMs;
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

const preset: TabPreset = {
  id: "test",
  name: "Test",
  description: "",
  bpm: 120,
  timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
  measures: 1,
  notes: [
    { string: 3, fret: 3, beat: 0 },
    { string: 3, fret: 3, beat: 2 },
  ],
};

// Minimal AudioEngine-shaped stub. `isActive` drives the RAF loop guard; tests
// that don't exercise onset processing keep it false.
const makeAudioEngine = (isActive = false) =>
  ({
    isActive,
    getTimeDomainData: () => new Float32Array(1024),
  }) as never;

describe("useTabPractice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    engineBeatCallback = null;
    mockBpm = 120;
    mockIsPlaying = false;
    mockTimeMs = null;
  });

  it("initializes in idle phase", () => {
    const { result } = renderHook(() => useTabPractice(preset, null));
    expect(result.current.phase).toBe("idle");
    expect(result.current.loop).toBe(0);
    expect(result.current.timingEvents).toEqual([]);
  });

  it("startSession does nothing when audioEngine is null", async () => {
    const { result } = renderHook(() => useTabPractice(preset, null));
    await act(async () => {
      await result.current.startSession();
    });
    expect(result.current.phase).toBe("idle");
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("transitions countdown → playing on startSession and starts the metronome", async () => {
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine()),
    );
    await act(async () => {
      await result.current.startSession();
    });
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe("playing");
  });

  it("falls back to idle phase if the metronome fails to start", async () => {
    mockStart.mockImplementationOnce(async () => {
      throw new Error("audio hw failure");
    });
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine()),
    );
    await expect(
      act(async () => {
        await result.current.startSession();
      }),
    ).rejects.toThrow("audio hw failure");
    expect(result.current.phase).toBe("idle");
  });

  it("builds timing targets on the very first beat", async () => {
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine()),
    );
    await act(async () => {
      await result.current.startSession();
    });
    // Before any beat, no target-driven events exist.
    expect(result.current.timingEvents).toEqual([]);
    // Drive beat 0 — builds targets anchored at the scheduled time.
    act(() => {
      engineBeatCallback?.(0, 0);
    });
    expect(result.current.currentBeat).toBe(0);
    // Still no timing events (no onsets evaluated).
    expect(result.current.timingEvents).toEqual([]);
  });

  it("emits misses and increments loop when wrapping past totalBeats", async () => {
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine()),
    );
    await act(async () => {
      await result.current.startSession();
    });
    act(() => engineBeatCallback?.(0, 0));
    expect(result.current.loop).toBe(0);

    // beat 4 % 4 === 0 and beat > 0 → loop boundary.
    // targets had 2 unhit notes; both become misses.
    act(() => engineBeatCallback?.(4, 2.0));
    expect(result.current.loop).toBe(1);
    expect(result.current.timingEvents).toHaveLength(2);
    expect(result.current.timingEvents.every((e) => e.judgment === "miss")).toBe(
      true,
    );
  });

  it("flushes unhit targets to misses on stopSession and marks phase finished", async () => {
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine()),
    );
    await act(async () => {
      await result.current.startSession();
    });
    act(() => engineBeatCallback?.(0, 0));

    await act(async () => {
      await result.current.stopSession();
    });

    expect(result.current.phase).toBe("finished");
    expect(result.current.timingEvents).toHaveLength(2);
    expect(mockStop).toHaveBeenCalled();
  });

  it("uses the engine BPM (not preset.bpm) when building targets", async () => {
    // Preset has out-of-range BPM that the engine would clamp to 300.
    const fastPreset: TabPreset = { ...preset, bpm: 999 };
    mockBpm = 300;
    const { result } = renderHook(() =>
      useTabPractice(fastPreset, makeAudioEngine()),
    );
    await act(async () => {
      await result.current.startSession();
    });
    // Beat 0 builds targets at scheduled time 0s using engine BPM 300:
    //   msPerBeat = 200 → beat 2 target at 400ms.
    // (If preset.bpm=999 were used, msPerBeat ≈ 60 → beat 2 at ~120ms.)
    act(() => engineBeatCallback?.(0, 0));
    // Loop boundary at scheduled time 0.8s flushes the previous loop's
    // targets as misses — targetTimeMs for beat 2 proves which BPM was used.
    act(() => engineBeatCallback?.(4, 0.8));
    const misses = result.current.timingEvents;
    expect(misses).toHaveLength(2);
    const beat2Miss = misses.find((e) => e.targetBeat === 2);
    expect(beat2Miss?.targetTimeMs).toBe(400);
  });
});
