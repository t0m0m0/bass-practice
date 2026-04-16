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
