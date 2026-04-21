import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom は requestAnimationFrame を実装していないため、スタブを提供する
vi.stubGlobal("requestAnimationFrame", vi.fn(() => 0));
vi.stubGlobal("cancelAnimationFrame", vi.fn());

// globals: true を使わない構成では @testing-library/react が afterEach を
// 自動登録できないため、手動でクリーンアップする
afterEach(() => {
  cleanup();
});

// jsdom's default localStorage is not functional under the current
// vitest config; provide a minimal in-memory implementation so hooks
// that persist settings can be tested deterministically.
const memStore = new Map<string, string>();
const memLocalStorage: Storage = {
  get length() {
    return memStore.size;
  },
  clear: () => memStore.clear(),
  getItem: (k) => (memStore.has(k) ? memStore.get(k)! : null),
  setItem: (k, v) => {
    memStore.set(k, String(v));
  },
  removeItem: (k) => {
    memStore.delete(k);
  },
  key: (i) => Array.from(memStore.keys())[i] ?? null,
};
vi.stubGlobal("localStorage", memLocalStorage);
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: memLocalStorage,
});
