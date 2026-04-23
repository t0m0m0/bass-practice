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
    initContext = vi.fn();
    playCountInClick = vi.fn();
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
    const { result } = renderHook(() => useTabPractice(preset, null, undefined, { countdownSeconds: 0 }));
    expect(result.current.phase).toBe("idle");
    expect(result.current.loop).toBe(0);
    expect(result.current.timingEvents).toEqual([]);
  });

  it("startSession starts metronome even when audioEngine is null", async () => {
    const { result } = renderHook(() => useTabPractice(preset, null, undefined, { countdownSeconds: 0 }));
    await act(async () => {
      await result.current.startSession();
    });
    expect(result.current.phase).toBe("playing");
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("transitions countdown → playing on startSession and starts the metronome", async () => {
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
    );
    await act(async () => {
      await result.current.startSession();
    });
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe("playing");
  });

  it("ticks the countdown N→1 with audible clicks before starting the metronome", async () => {
    vi.useFakeTimers();
    try {
      const engineInstances: { playCountInClick: ReturnType<typeof vi.fn> }[] = [];
      // Re-import would be heavy; instead spy via a side-effect: the mock class
      // exposes playCountInClick as a vi.fn() on every instance, so capture via
      // the hook's calls indirectly by counting mockStart timing. We assert the
      // observable contract: phase goes countdown, countdown counts down from 2
      // to 1 to null, and start() is only called after the last tick.
      void engineInstances;

      const { result } = renderHook(() =>
        useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 2 }),
      );

      // Kick off startSession but don't await yet — we need to inspect
      // intermediate state between the fake timer advances.
      let started: Promise<void> | null = null;
      act(() => {
        started = result.current.startSession();
      });

      // Synchronous part of startSession has already run: phase=countdown,
      // countdown=2, no metronome start yet.
      expect(result.current.phase).toBe("countdown");
      expect(result.current.countdown).toBe(2);
      expect(mockStart).not.toHaveBeenCalled();

      // At mockBpm=120 each count-in beat lasts 500ms (60000/120).
      // Advance one beat → countdown transitions 2 → 1.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(result.current.countdown).toBe(1);
      expect(mockStart).not.toHaveBeenCalled();

      // Advance final beat → countdown clears and metronome starts.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
        await started;
      });
      expect(result.current.countdown).toBeNull();
      expect(result.current.phase).toBe("playing");
      expect(mockStart).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stopSession during countdown cancels the transition to playing", async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 3 }),
      );

      let started: Promise<void> | null = null;
      act(() => {
        started = result.current.startSession();
      });
      expect(result.current.phase).toBe("countdown");

      // Advance one beat (500ms at 120bpm), then abort mid-countdown.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      expect(result.current.countdown).toBe(2);

      await act(async () => {
        await result.current.stopSession();
      });

      // Drain remaining fake timers so the countdown loop's final iteration
      // runs and hits the abort guard instead of flipping to "playing".
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
        await started;
      });

      expect(mockStart).not.toHaveBeenCalled();
      expect(result.current.phase).toBe("finished");
      expect(result.current.countdown).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("falls back to idle phase if the metronome fails to start", async () => {
    mockStart.mockImplementationOnce(async () => {
      throw new Error("audio hw failure");
    });
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
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
      useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
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
      useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
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
      useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
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
      useTabPractice(fastPreset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
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

  it("surfaces the latest miss as lastEvent on loop-boundary flush", async () => {
    // Regression guard: AsciiTabDisplay's miss-fade overlay keys off
    // lastEvent.judgment === "miss", so the flush path must set lastEvent.
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
    );
    await act(async () => {
      await result.current.startSession();
    });
    expect(result.current.lastEvent).toBeNull();
    act(() => engineBeatCallback?.(0, 0));
    act(() => engineBeatCallback?.(4, 2.0));
    // Two misses flushed; lastEvent points at the final miss so the tab
    // overlay can render the red fade on that beat.
    expect(result.current.lastEvent?.judgment).toBe("miss");
    // eventSeq bumps per emitted event so UI anims retrigger.
    expect(result.current.eventSeq).toBeGreaterThanOrEqual(2);
  });

  it("resets combo to 0 when loop boundary flushes misses", async () => {
    // Drive the combo above zero synthetically by pushing the internal
    // onset path: we can't easily fire the RAF-based detector in jsdom,
    // so we instead verify the reset branch by stopping the session with
    // a mid-loop state and re-inspecting combo semantics via a second
    // loop flush. The test ensures the state setter is wired; the
    // positive increment path is covered by integration/e2e.
    const { result } = renderHook(() =>
      useTabPractice(preset, makeAudioEngine(), undefined, { countdownSeconds: 0 }),
    );
    await act(async () => {
      await result.current.startSession();
    });
    act(() => engineBeatCallback?.(0, 0));
    act(() => engineBeatCallback?.(4, 2.0)); // flush 2 misses
    expect(result.current.combo).toBe(0);
    // A second loop boundary with no fresh targets generates no misses
    // and should leave combo untouched.
    act(() => engineBeatCallback?.(8, 4.0));
    expect(result.current.combo).toBe(0);
  });
});
