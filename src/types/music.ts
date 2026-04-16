export interface FretPosition {
  string: number;
  fret: number;
  note: string;
  pitchClass: string;
  frequency: number;
}

export interface ScaleDefinition {
  key: string;
  type: string;
  notes: string[];
}

export interface Tuning {
  name: string;
  notes: string[];
}

export interface FretboardConfig {
  tuning: Tuning;
  fretCount: number;
  startFret: number;
  endFret: number;
}
