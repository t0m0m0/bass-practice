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
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts disabled by default", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));
    expect(result.current.config.enabled).toBe(false);
  });

  it("does not increase BPM when disabled", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));
    const events: TimingEvent[] = [makeHit(0), makeHit(1), makeHit(2)];
    act(() => {
      result.current.evaluateLoop(events);
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
      result.current.evaluateLoop(events);
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
      result.current.evaluateLoop(events);
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
      result.current.evaluateLoop(events);
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
      result.current.evaluateLoop(events);
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
      result.current.evaluateLoop(events);
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
      result.current.evaluateLoop(events);
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
      result.current.evaluateLoop(events);
    });

    expect(setBpm).toHaveBeenCalledWith(130); // increment of 10
  });

  it("ignores empty loop events", () => {
    const { result } = renderHook(() => useAutoBpm(100, setBpm));

    act(() => {
      result.current.setEnabled(true);
    });

    act(() => {
      result.current.evaluateLoop([]);
    });

    expect(setBpm).not.toHaveBeenCalled();
  });
});
