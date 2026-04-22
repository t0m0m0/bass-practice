import type { TabPreset, TabNote, TimeSignature } from "../types/practice";

export const CUSTOM_TABS_STORAGE_KEY = "bass-practice.customTabs.v1";

export function loadCustomTabs(): TabPreset[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TABS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPreset);
  } catch {
    return [];
  }
}

export function saveCustomTabs(tabs: TabPreset[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CUSTOM_TABS_STORAGE_KEY, JSON.stringify(tabs));
}

function isValidPreset(value: unknown): value is TabPreset {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.description === "string" &&
    typeof v.bpm === "number" &&
    typeof v.measures === "number" &&
    v.timeSignature != null &&
    typeof v.timeSignature === "object" &&
    Array.isArray(v.notes)
  );
}

export function generateId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `custom-${Date.now().toString(36)}-${rand}`;
}

export function createEmptyPreset(overrides: Partial<TabPreset> = {}): TabPreset {
  return {
    id: generateId(),
    name: "新しいタブ譜",
    description: "",
    bpm: 90,
    timeSignature: { beatsPerMeasure: 4, beatUnit: 4 },
    measures: 2,
    notes: [],
    ...overrides,
  };
}

export function cloneAsCustom(preset: TabPreset, nameSuffix = " (コピー)"): TabPreset {
  return {
    ...preset,
    id: generateId(),
    name: preset.name + nameSuffix,
    notes: preset.notes.map((n) => ({ ...n })),
    timeSignature: { ...preset.timeSignature },
  };
}

/**
 * Resize preset notes to fit new time signature / measures.
 * Drops notes whose beat falls outside the new total beat count.
 */
export function resizeNotes(
  notes: TabNote[],
  timeSignature: TimeSignature,
  measures: number,
): TabNote[] {
  const total = timeSignature.beatsPerMeasure * measures;
  return notes.filter((n) => n.beat < total);
}

export function toggleNote(
  notes: TabNote[],
  stringNum: number,
  beat: number,
  fret: number,
): TabNote[] {
  const existingIdx = notes.findIndex(
    (n) => n.string === stringNum && n.beat === beat,
  );
  if (existingIdx >= 0) {
    // Same fret => remove. Different fret => replace.
    if (notes[existingIdx].fret === fret) {
      return notes.filter((_, i) => i !== existingIdx);
    }
    return notes.map((n, i) => (i === existingIdx ? { ...n, fret } : n));
  }
  return [...notes, { string: stringNum, fret, beat }];
}
