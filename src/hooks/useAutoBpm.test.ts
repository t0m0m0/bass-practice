import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoBpm } from "./useAutoBpm";
import type { TimingEvent, HitTimingEvent, MissTimingEvent } from "../types/practice";

function makeHit(beat: number, deltaMs = 10): HitTimingEvent {
  return {
    targetBeat: beat,
    targetTimeMs: beat * 500,
    onsetTimeMs: beat * 500 + deltaMs,
    deltaMs,
    judgment: "hit",
  };
}

function makeMiss(beat: number): MissTimingEvent {
  return {
    targetBeat: beat,
    targetTimeMs: beat * 500,
    onsetTimeMs: null,
    deltaMs: null,
    judgment: "miss",
  };
}

describe("useAutoBpm", () => {
  let setBpm: (bpm: number) => void;

  beforeEach(() => {
    setBpm = vi.fn();
    vi.useFakeTimers();
    window.localStorage.removeItem("bass-practice.autoBpmConfig");
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.removeItem("bass-practice.autoBpmConfig");
  });

  it("starts disabled by default", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));
    expect(result.current.config.enabled).toBe(false);
  });

  it("does not increase BPM when disabled", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));
    const events: TimingEvent[] = [makeHit(0), makeHit(1), makeHit(2)];
    act(() => {
      result.current.evaluateLoop(events, 100);
    });
    expect(setBpm).not.toHaveBeenCalled();
  });

  it("increases BPM when hit rate exceeds threshold", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    // 100% hit rate, threshold is 90%
    const events: TimingEvent[] = [makeHit(0), makeHit(1), makeHit(2)];
    act(() => {
      result.current.evaluateLoop(events, 100);
    });

    expect(setBpm).toHaveBeenCalledWith(105); // default increment is 5
    expect(result.current.levelUps).toBe(1);
    expect(result.current.notification).toContain("BPM UP");
  });

  it("does not increase BPM when hit rate is below threshold", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    // 50% hit rate < 90% threshold
    const events: TimingEvent[] = [makeHit(0), makeMiss(1)];
    act(() => {
      result.current.evaluateLoop(events, 100);
    });

    expect(setBpm).not.toHaveBeenCalled();
  });

  it("respects maxBpm", () => {
    const { result } = renderHook(() => useAutoBpm(298, setBpm));

    act(() => {
      result.current.setEnabled(true);
      result.current.setMaxBpm(300);
    });

    const events: TimingEvent[] = [makeHit(0), makeHit(1)];
    act(() => {
      result.current.evaluateLoop(events, 298);
    });

    expect(setBpm).toHaveBeenCalledWith(300); // capped at max
  });

  it("does not increase past maxBpm", () => {
    const { result } = renderHook(() => useAutoBpm(300, setBpm));

    act(() => {
      result.current.setEnabled(true);
      result.current.setMaxBpm(300);
    });

    const events: TimingEvent[] = [makeHit(0), makeHit(1)];
    act(() => {
      result.current.evaluateLoop(events, 300);
    });

    expect(setBpm).not.toHaveBeenCalled();
  });

  it("clears notification after timeout", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    const events: TimingEvent[] = [makeHit(0), makeHit(1)];
    act(() => {
      result.current.evaluateLoop(events, 100);
    });

    expect(result.current.notification).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.notification).toBeNull();
  });

  it("resets session state", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    const events: TimingEvent[] = [makeHit(0), makeHit(1)];
    act(() => {
      result.current.evaluateLoop(events, 100);
    });

    expect(result.current.levelUps).toBe(1);

    act(() => {
      result.current.resetSession(80);
    });

    expect(result.current.levelUps).toBe(0);
    expect(result.current.startBpm).toBe(80);
    expect(result.current.notification).toBeNull();
  });

  it("respects custom threshold and increment", () => {
    const { result } = renderHook(() => useAutoBpm(120, setBpm));

    act(() => {
      result.current.setEnabled(true);
      result.current.setHitRateThreshold(0.5);
      result.current.setBpmIncrement(10);
    });

    // 66% hit rate > 50% threshold
    const events: TimingEvent[] = [makeHit(0), makeHit(1), makeMiss(2)];
    act(() => {
      result.current.evaluateLoop(events, 120);
    });

    expect(setBpm).toHaveBeenCalledWith(130); // increment of 10
  });

  it("compounds BPM across consecutive loops using the passed-in currentBpm", () => {
    // Regression: evaluateLoop must rely on the caller-supplied currentBpm,
    // not on a stale value closed over at hook render time. Two back-to-back
    // loops (without any re-render between them) should both increase BPM.
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    const events: TimingEvent[] = [makeHit(0), makeHit(1)];
    act(() => {
      result.current.evaluateLoop(events, 100);
      // Simulate the caller reading the fresh BPM from a ref on the next
      // loop boundary, before React has flushed the previous setBpm.
      result.current.evaluateLoop(events, 105);
    });

    expect(setBpm).toHaveBeenNthCalledWith(1, 105);
    expect(setBpm).toHaveBeenNthCalledWith(2, 110);
    expect(result.current.levelUps).toBe(2);
  });

  it("clears pending notification timer on unmount", () => {
    const { result, unmount } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    const events: TimingEvent[] = [makeHit(0), makeHit(1)];
    act(() => {
      result.current.evaluateLoop(events, 100);
    });
    expect(result.current.notification).not.toBeNull();

    unmount();
    // Advancing past the notification timeout must not throw or cause
    // a state update on an unmounted component.
    expect(() => {
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });

  it("persists config changes to localStorage (excluding enabled)", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
      result.current.setHitRateThreshold(0.75);
      result.current.setBpmIncrement(7);
      result.current.setMaxBpm(250);
    });

    const stored = JSON.parse(
      window.localStorage.getItem("bass-practice.autoBpmConfig")!,
    );
    expect(stored).toEqual({
      hitRateThreshold: 0.75,
      bpmIncrement: 7,
      maxBpm: 250,
    });
    expect(stored.enabled).toBeUndefined();
  });

  it("restores persisted config on next mount with enabled=false", () => {
    window.localStorage.setItem(
      "bass-practice.autoBpmConfig",
      JSON.stringify({
        hitRateThreshold: 0.6,
        bpmIncrement: 8,
        maxBpm: 180,
      }),
    );

    const { result } = renderHook(() => useAutoBpm(100, setBpm));
    expect(result.current.config).toEqual({
      enabled: false,
      hitRateThreshold: 0.6,
      bpmIncrement: 8,
      maxBpm: 180,
    });
  });

  it("falls back to defaults when localStorage has invalid JSON", () => {
    window.localStorage.setItem("bass-practice.autoBpmConfig", "not json {{");
    const { result } = renderHook(() => useAutoBpm(100, setBpm));
    expect(result.current.config.hitRateThreshold).toBe(0.9);
    expect(result.current.config.bpmIncrement).toBe(5);
    expect(result.current.config.maxBpm).toBe(200);
  });

  it("ignores out-of-range persisted values", () => {
    window.localStorage.setItem(
      "bass-practice.autoBpmConfig",
      JSON.stringify({
        hitRateThreshold: 2, // invalid > 1
        bpmIncrement: -1, // invalid
        maxBpm: 0, // invalid
      }),
    );
    const { result } = renderHook(() => useAutoBpm(100, setBpm));
    // Each invalid field falls back to its default individually.
    expect(result.current.config.hitRateThreshold).toBe(0.9);
    expect(result.current.config.bpmIncrement).toBe(5);
    expect(result.current.config.maxBpm).toBe(200);
  });

  it("ignores empty loop events", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    act(() => {
      result.current.evaluateLoop([], 100);
    });

    expect(setBpm).not.toHaveBeenCalled();
  });
});
