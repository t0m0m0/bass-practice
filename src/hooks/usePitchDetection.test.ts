import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePitchDetection } from "./usePitchDetection";
import type { AudioEngine } from "../lib/audio/AudioEngine";
import type { PitchResult } from "../types/audio";

// RAF コールバックを手動で制御するため、テスト内でスタブを上書き
let rafCallbacks: FrameRequestCallback[];

function makePitch(overrides: Partial<PitchResult> = {}): PitchResult {
  return {
    frequency: 110,
    clarity: 0.95,
    note: "A2",
    pitchClass: "A",
    cents: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeNullPitch(): PitchResult {
  return {
    frequency: 0,
    clarity: 0,
    note: null,
    pitchClass: null,
    cents: 0,
    timestamp: Date.now(),
  };
}

function makeMockEngine(detectPitchReturn: PitchResult): Pick<AudioEngine, "detectPitch"> {
  return {
    detectPitch: vi.fn().mockReturnValue(detectPitchReturn),
  };
}

// RAF を手動トリガー方式でスタブ化
function setupRaf() {
  rafCallbacks = [];
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
}

// 最後に登録された RAF コールバックを 1 回実行する
function tickRaf() {
  const cb = rafCallbacks[rafCallbacks.length - 1];
  if (cb) act(() => { cb(0); });
}

describe("usePitchDetection", () => {
  beforeEach(() => {
    setupRaf();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("非アクティブ状態", () => {
    it("engine が null のとき pitch は null", () => {
      const { result } = renderHook(() => usePitchDetection(null, false));
      expect(result.current.pitch).toBeNull();
    });

    it("isListening が false のとき pitch は null", () => {
      const engine = makeMockEngine(makePitch());
      const { result } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, false),
      );
      expect(result.current.pitch).toBeNull();
    });

    it("engine が null のとき RAF は登録されない", () => {
      renderHook(() => usePitchDetection(null, true));
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe("ピッチ検出ループ", () => {
    it("engine がノートを検出したとき pitch が更新される", () => {
      const pitch = makePitch();
      const engine = makeMockEngine(pitch);

      const { result } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, true),
      );
      tickRaf();
      expect(result.current.pitch).toEqual(pitch);
    });

    it("engine がノートなしを返したとき pitch は null になる", () => {
      const engine = makeMockEngine(makeNullPitch());

      const { result } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, true),
      );
      tickRaf();
      expect(result.current.pitch).toBeNull();
    });

    it("同じノート・近いセントでは pitch オブジェクトが再生成されない（安定化）", () => {
      const pitch = makePitch({ cents: 0 });
      const engine = makeMockEngine(pitch);

      const { result } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, true),
      );
      tickRaf();
      const first = result.current.pitch;

      // 同じノート・差 4 cents (MIN_CENTS_CHANGE=5 未満) → 同一オブジェクトを保持
      engine.detectPitch = vi.fn().mockReturnValue(makePitch({ cents: 4 }));
      tickRaf();
      expect(result.current.pitch).toBe(first); // 参照が同じ
    });

    it("セントの差が大きい場合は pitch を更新する", () => {
      const pitch = makePitch({ cents: 0 });
      const engine = makeMockEngine(pitch);

      const { result } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, true),
      );
      tickRaf();
      const first = result.current.pitch;

      engine.detectPitch = vi.fn().mockReturnValue(makePitch({ cents: 10 }));
      tickRaf();
      expect(result.current.pitch).not.toBe(first);
      expect(result.current.pitch?.cents).toBe(10);
    });
  });

  describe("ホールド動作（フリッカー防止）", () => {
    it("ノートが途切れても HOLD_DURATION (200ms) 以内は前のピッチを保持する", () => {
      // toFake: ['Date'] のみ指定して RAF スタブを上書きしないようにする
      vi.useFakeTimers({ toFake: ["Date"] });
      const startTime = Date.now();
      const pitch = makePitch({ timestamp: startTime });
      const engine = makeMockEngine(pitch);

      const { result } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, true),
      );
      tickRaf(); // ノートあり → pitch セット
      expect(result.current.pitch).toEqual(pitch);

      // ノートなしに切り替え
      engine.detectPitch = vi.fn().mockReturnValue(makeNullPitch());

      // 100ms 進める（HOLD_DURATION = 200ms 未満）
      vi.setSystemTime(startTime + 100);
      tickRaf();
      expect(result.current.pitch).toEqual(pitch); // まだ保持
    });

    it("HOLD_DURATION を超えると pitch が null になる", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      const startTime = Date.now();
      const pitch = makePitch({ timestamp: startTime });
      const engine = makeMockEngine(pitch);

      const { result } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, true),
      );
      tickRaf(); // ノートあり → pitch セット
      expect(result.current.pitch).toEqual(pitch);

      engine.detectPitch = vi.fn().mockReturnValue(makeNullPitch());

      // 300ms 進める（HOLD_DURATION = 200ms 超過）
      vi.setSystemTime(startTime + 300);
      tickRaf();
      expect(result.current.pitch).toBeNull();
    });
  });

  describe("依存値変更時のリセット", () => {
    it("isListening が false になると pitch が null にリセットされる", () => {
      const pitch = makePitch();
      const engine = makeMockEngine(pitch);

      const { result, rerender } = renderHook(
        ({ isListening }: { isListening: boolean }) =>
          usePitchDetection(engine as AudioEngine, isListening),
        { initialProps: { isListening: true } },
      );
      tickRaf();
      expect(result.current.pitch).toEqual(pitch);

      rerender({ isListening: false });
      expect(result.current.pitch).toBeNull();
    });

    it("アンマウント時に RAF がキャンセルされる", () => {
      const engine = makeMockEngine(makePitch());
      const { unmount } = renderHook(() =>
        usePitchDetection(engine as AudioEngine, true),
      );
      unmount();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
