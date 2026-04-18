import type { ScaleDefinition, Tuning, FretPosition } from "./music";

export type PracticeMode = "free" | "guided";

export interface PracticeSession {
  mode: PracticeMode;
  scale: ScaleDefinition;
  tuning: Tuning;
  startedAt: number;
  notesPlayed: PlayedNote[];
  currentTargetNote: string | null;
  targetSequence: string[];
  sequenceIndex: number;
}

export interface PlayedNote {
  note: string;
  pitchClass: string;
  frequency: number;
  clarity: number;
  cents: number;
  isInScale: boolean;
  isTargetNote: boolean;
  timestamp: number;
  fretPositions: FretPosition[];
}

// --- Tab Practice types ---

export interface TimeSignature {
  beatsPerMeasure: number;
  beatUnit: number; // 4 = quarter note, 8 = eighth note
}

export interface TabNote {
  string: number; // 1-4 (G=1, D=2, A=3, E=4)
  fret: number;
  beat: number; // 0-based, 0.5 increments for eighth notes
  duration?: number; // in beats, default 0.5
  label?: string; // optional display label
}

export interface TabPreset {
  id: string;
  name: string;
  description: string;
  bpm: number;
  timeSignature: TimeSignature;
  measures: number;
  notes: TabNote[];
}

export type TimingJudgment = "hit" | "early" | "late" | "miss";

interface TimingEventBase {
  targetBeat: number;
  targetTimeMs: number;
}

export interface HitTimingEvent extends TimingEventBase {
  judgment: "hit" | "early" | "late";
  onsetTimeMs: number;
  deltaMs: number; // positive = late, negative = early
}

export interface MissTimingEvent extends TimingEventBase {
  judgment: "miss";
  onsetTimeMs: null;
  deltaMs: null;
}

export type TimingEvent = HitTimingEvent | MissTimingEvent;

export type TabSessionPhase = "idle" | "countdown" | "playing" | "finished";

export interface TabSessionState {
  phase: TabSessionPhase;
  currentBeat: number;
  currentMeasure: number;
  loop: number;
  timingEvents: TimingEvent[];
  hitCount: number;
  missCount: number;
  earlyCount: number;
  lateCount: number;
  avgAbsDeltaMs: number;
}
