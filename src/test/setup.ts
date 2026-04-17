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
