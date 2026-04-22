import { beforeEach, describe, expect, it } from "vitest";
import {
  CUSTOM_TABS_STORAGE_KEY,
  cloneAsCustom,
  createEmptyPreset,
  loadCustomTabs,
  resizeNotes,
  saveCustomTabs,
  toggleNote,
} from "./customTabs";
import type { TabPreset } from "../types/practice";

beforeEach(() => {
  localStorage.clear();
});

describe("customTabs persistence", () => {
  it("returns [] when nothing stored", () => {
    expect(loadCustomTabs()).toEqual([]);
  });

  it("roundtrips via save/load", () => {
    const preset = createEmptyPreset({ name: "Foo" });
    saveCustomTabs([preset]);
    expect(loadCustomTabs()).toEqual([preset]);
  });

  it("ignores corrupt JSON", () => {
    localStorage.setItem(CUSTOM_TABS_STORAGE_KEY, "{ not json");
    expect(loadCustomTabs()).toEqual([]);
  });

  it("filters invalid entries", () => {
    localStorage.setItem(
      CUSTOM_TABS_STORAGE_KEY,
      JSON.stringify([{ broken: true }, createEmptyPreset({ name: "ok" })]),
    );
    const loaded = loadCustomTabs();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe("ok");
  });
});

describe("cloneAsCustom", () => {
  it("generates new id and appends suffix", () => {
    const src: TabPreset = createEmptyPreset({ id: "orig", name: "Foo" });
    const copy = cloneAsCustom(src);
    expect(copy.id).not.toBe("orig");
    expect(copy.name).toBe("Foo (コピー)");
    expect(copy.notes).not.toBe(src.notes);
  });
});

describe("resizeNotes", () => {
  it("drops notes beyond total beats", () => {
    const notes = [
      { string: 1, fret: 0, beat: 0 },
      { string: 1, fret: 0, beat: 7 },
      { string: 1, fret: 0, beat: 8 },
    ];
    const result = resizeNotes(notes, { beatsPerMeasure: 4, beatUnit: 4 }, 2);
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.beat)).toEqual([0, 7]);
  });
});

describe("toggleNote", () => {
  it("adds a new note", () => {
    const result = toggleNote([], 1, 0, 5);
    expect(result).toEqual([{ string: 1, fret: 5, beat: 0 }]);
  });

  it("removes when same fret clicked twice", () => {
    const start = [{ string: 1, fret: 5, beat: 0 }];
    expect(toggleNote(start, 1, 0, 5)).toEqual([]);
  });

  it("replaces fret when different", () => {
    const start = [{ string: 1, fret: 5, beat: 0 }];
    const result = toggleNote(start, 1, 0, 7);
    expect(result).toEqual([{ string: 1, fret: 7, beat: 0 }]);
  });
});
