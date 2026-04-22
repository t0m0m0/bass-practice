import { useCallback, useSyncExternalStore } from "react";
import type { TabPreset } from "../types/practice";
import {
  CUSTOM_TABS_STORAGE_KEY,
  loadCustomTabs,
  saveCustomTabs,
} from "../lib/customTabs";

// Simple event-based store so multiple hook consumers stay in sync.
type Listener = () => void;
const listeners = new Set<Listener>();
let cache: TabPreset[] | null = null;

function getSnapshot(): TabPreset[] {
  if (cache === null) cache = loadCustomTabs();
  return cache;
}

function getServerSnapshot(): TabPreset[] {
  return [];
}

function notify() {
  cache = loadCustomTabs();
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CUSTOM_TABS_STORAGE_KEY) notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function mutate(next: TabPreset[]) {
  saveCustomTabs(next);
  notify();
}

export function useCustomTabs() {
  const tabs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const upsert = useCallback((tab: TabPreset) => {
    const current = getSnapshot();
    const idx = current.findIndex((t) => t.id === tab.id);
    const next = idx >= 0
      ? current.map((t, i) => (i === idx ? tab : t))
      : [...current, tab];
    mutate(next);
  }, []);

  const remove = useCallback((id: string) => {
    mutate(getSnapshot().filter((t) => t.id !== id));
  }, []);

  const getById = useCallback((id: string): TabPreset | undefined => {
    return getSnapshot().find((t) => t.id === id);
  }, []);

  return { tabs, upsert, remove, getById };
}

export function findCustomTab(id: string): TabPreset | undefined {
  return getSnapshot().find((t) => t.id === id);
}
