import { describe, it, expect, vi, beforeEach } from "vitest";
import { PitchAnalyzer } from "./pitchDetection";

// pitchy の PitchDetector をモック化（vi.mock はホイスティングされるため vi.hoisted で事前初期化）
const mockFindPitch = vi.hoisted(() =>
  vi.fn<() => [number, number]>().mockReturnValue([440, 0.95]),
);

vi.mock("pitchy", () => ({
  PitchDetector: {
    forFloat32Array: vi.fn(() => ({ findPitch: mockFindPitch })),
  },
}));

describe("PitchAnalyzer", () => {
  let analyzer: PitchAnalyzer;

  beforeEach(() => {
    analyzer = new PitchAnalyzer();
    vi.clearAllMocks();
    mockFindPitch.mockReturnValue([440, 0.95]);
  });

  describe("空のバッファ", () => {
    it("空バッファでは detected: false になる", () => {
      const result = analyzer.detectPitch(new Float32Array(0), 44100);
      expect(result.detected).toBe(false);
      expect(result.frequency).toBe(0);
      expect(result.clarity).toBe(0);
    });
  });

  describe("クラリティフィルタ", () => {
    it("クラリティが閾値を下回る場合は detected: false を返す", () => {
      mockFindPitch.mockReturnValue([440, 0.5]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(false);
    });

    it("クラリティが閾値ちょうどの場合も detected: true を返す（以上判定）", () => {
      mockFindPitch.mockReturnValue([440, 0.9]);
      // デフォルト閾値 0.9 → clarity < 0.9 は false → detected: true
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
    });

    it("clarityThreshold を下げると低クラリティでも検出できる", () => {
      mockFindPitch.mockReturnValue([440, 0.7]);
      analyzer.clarityThreshold = 0.6;
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
      if (result.detected) {
        expect(result.note).toBe("A4");
      }
    });
  });

  describe("周波数範囲フィルタ（ベース: 30–500 Hz）", () => {
    it("下限 (30 Hz) 未満は detected: false を返す", () => {
      mockFindPitch.mockReturnValue([20, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(false);
    });

    it("上限 (500 Hz) 超過は detected: false を返す", () => {
      mockFindPitch.mockReturnValue([600, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(false);
    });

    it("下限ちょうど (30 Hz) は検出する", () => {
      mockFindPitch.mockReturnValue([30, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
    });

    it("上限ちょうど (500 Hz) は検出する", () => {
      mockFindPitch.mockReturnValue([500, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
    });
  });

  describe("ノート・ピッチクラス変換", () => {
    it("A4 (440 Hz) を正しく変換する", () => {
      mockFindPitch.mockReturnValue([440, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
      if (!result.detected) return;
      expect(result.note).toBe("A4");
      expect(result.pitchClass).toBe("A");
      expect(result.frequency).toBe(440);
      expect(result.clarity).toBe(0.95);
    });

    it("ベースの開放弦 E1 (約 41 Hz) を検出する", () => {
      mockFindPitch.mockReturnValue([41.2, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
      if (!result.detected) return;
      expect(result.pitchClass).toBe("E");
    });

    it("シャープ表記を使う（フラットは使わない）", () => {
      // C#4 ≈ 277.18 Hz
      mockFindPitch.mockReturnValue([277.18, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
      if (!result.detected) return;
      expect(result.note).toMatch(/^C#/);
      expect(result.note).not.toMatch(/^Db/);
    });

    it("pitchClass からオクターブ番号を取り除く", () => {
      mockFindPitch.mockReturnValue([440, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.detected).toBe(true);
      if (!result.detected) return;
      expect(result.pitchClass).not.toMatch(/[0-9]/);
    });
  });

  describe("セント計算", () => {
    it("ちょうど A4 のとき cents = 0", () => {
      mockFindPitch.mockReturnValue([440, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(result.cents).toBe(0);
    });

    it("cents は整数に丸められる", () => {
      mockFindPitch.mockReturnValue([440, 0.95]);
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      expect(Number.isInteger(result.cents)).toBe(true);
    });
  });

  describe("タイムスタンプ", () => {
    it("result.timestamp は呼び出し時刻を含む", () => {
      const before = Date.now();
      const result = analyzer.detectPitch(new Float32Array(4096), 44100);
      const after = Date.now();
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });

    it("空バッファでも timestamp を返す", () => {
      const before = Date.now();
      const result = analyzer.detectPitch(new Float32Array(0), 44100);
      const after = Date.now();
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
