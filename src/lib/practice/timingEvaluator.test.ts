import { describe, it, expect } from "vitest";
import {
  buildTimingTargets,
  evaluateOnset,
  generateMisses,
  computeStats,
} from "./timingEvaluator";
import type { TabNote } from "../../types/practice";

const sampleNotes: TabNote[] = [
  { string: 3, fret: 3, beat: 0 },
  { string: 3, fret: 5, beat: 1 },
  { string: 2, fret: 2, beat: 2 },
  { string: 2, fret: 3, beat: 3 },
];

describe("buildTimingTargets", () => {
  it("creates targets for each unique beat", () => {
    const targets = buildTimingTargets(sampleNotes, 120, 0);
    expect(targets).toHaveLength(4);
    expect(targets[0]).toEqual({ beat: 0, timeMs: 0 });
    expect(targets[1]).toEqual({ beat: 1, timeMs: 500 }); // 60/120*1000 = 500ms per beat
    expect(targets[2]).toEqual({ beat: 2, timeMs: 1000 });
    expect(targets[3]).toEqual({ beat: 3, timeMs: 1500 });
  });

  it("applies start time offset", () => {
    const targets = buildTimingTargets(sampleNotes, 120, 1000);
    expect(targets[0].timeMs).toBe(1000);
    expect(targets[1].timeMs).toBe(1500);
  });

  it("deduplicates beats with multiple notes", () => {
    const notes: TabNote[] = [
      { string: 3, fret: 3, beat: 0 },
      { string: 2, fret: 5, beat: 0 }, // same beat
      { string: 3, fret: 5, beat: 1 },
    ];
    const targets = buildTimingTargets(notes, 120, 0);
    expect(targets).toHaveLength(2);
  });
});

describe("evaluateOnset", () => {
  const targets = buildTimingTargets(sampleNotes, 120, 0);
  // targets: beat 0 @ 0ms, beat 1 @ 500ms, beat 2 @ 1000ms, beat 3 @ 1500ms

  it("returns hit for onset within 30ms of target", () => {
    const event = evaluateOnset(10, targets, new Set());
    expect(event).not.toBeNull();
    expect(event!.judgment).toBe("hit");
    expect(event!.targetBeat).toBe(0);
    expect(event!.deltaMs).toBe(10);
  });

  it("returns early for onset 31-100ms before target", () => {
    const event = evaluateOnset(450, targets, new Set());
    expect(event).not.toBeNull();
    expect(event!.judgment).toBe("early");
    expect(event!.deltaMs).toBe(-50);
  });

  it("returns late for onset 31-100ms after target", () => {
    const event = evaluateOnset(550, targets, new Set());
    expect(event).not.toBeNull();
    expect(event!.judgment).toBe("late");
    expect(event!.deltaMs).toBe(50);
  });

  it("returns null for onset outside hit window", () => {
    const event = evaluateOnset(250, targets, new Set());
    expect(event).toBeNull();
  });

  it("skips already-hit beats", () => {
    const hitBeats = new Set([0]);
    const event = evaluateOnset(5, targets, hitBeats);
    // Should match beat 1 instead, but 5ms is far from 500ms
    expect(event).toBeNull();
  });
});

describe("generateMisses", () => {
  const targets = buildTimingTargets(sampleNotes, 120, 0);

  it("generates miss events for unhit targets", () => {
    const hitBeats = new Set([0, 2]);
    const misses = generateMisses(targets, hitBeats);
    expect(misses).toHaveLength(2);
    expect(misses[0].targetBeat).toBe(1);
    expect(misses[0].judgment).toBe("miss");
    expect(misses[0].onsetTimeMs).toBeNull();
    expect(misses[1].targetBeat).toBe(3);
  });

  it("returns empty array when all targets hit", () => {
    const hitBeats = new Set([0, 1, 2, 3]);
    const misses = generateMisses(targets, hitBeats);
    expect(misses).toHaveLength(0);
  });
});

describe("computeStats", () => {
  it("computes hit rate and avg absolute delta", () => {
    const events = [
      { targetBeat: 0, targetTimeMs: 0, onsetTimeMs: 10, deltaMs: 10, judgment: "hit" as const },
      { targetBeat: 1, targetTimeMs: 500, onsetTimeMs: 460, deltaMs: -40, judgment: "early" as const },
      { targetBeat: 2, targetTimeMs: 1000, onsetTimeMs: null, deltaMs: 0, judgment: "miss" as const },
    ];
    const stats = computeStats(events);
    expect(stats.hitRate).toBeCloseTo(2 / 3);
    expect(stats.avgAbsDeltaMs).toBe(25); // (10 + 40) / 2
  });

  it("returns zeros for empty events", () => {
    const stats = computeStats([]);
    expect(stats.hitRate).toBe(0);
    expect(stats.avgAbsDeltaMs).toBe(0);
  });

  it("handles all misses", () => {
    const events = [
      { targetBeat: 0, targetTimeMs: 0, onsetTimeMs: null, deltaMs: 0, judgment: "miss" as const },
    ];
    const stats = computeStats(events);
    expect(stats.hitRate).toBe(0);
    expect(stats.avgAbsDeltaMs).toBe(0);
  });
});
