import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PitchDisplay } from "./PitchDisplay";
import type { PitchResult } from "../../types/audio";

function makePitch(overrides: Partial<PitchResult & { detected: true }> = {}): PitchResult {
  return {
    detected: true,
    frequency: 110.0,
    clarity: 0.95,
    note: "A2",
    pitchClass: "A",
    cents: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("PitchDisplay", () => {
  describe("ピッチなしの状態 (pitch=null)", () => {
    it("ノート名の代わりに「---」を表示する", () => {
      render(<PitchDisplay pitch={null} />);
      expect(screen.getByText("---")).toBeInTheDocument();
    });

    it("周波数は「—」を表示する", () => {
      render(<PitchDisplay pitch={null} />);
      // 周波数欄と cents 欄の両方に「—」が出るため getAllByText で確認
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it("cents は「—」を表示する（ゲージ非アクティブ）", () => {
      render(<PitchDisplay pitch={null} />);
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("ピッチあり", () => {
    it("ノート名を表示する", () => {
      render(<PitchDisplay pitch={makePitch({ note: "A2" })} />);
      expect(screen.getByText("A2")).toBeInTheDocument();
    });

    it("周波数を Hz 単位で表示する", () => {
      render(<PitchDisplay pitch={makePitch({ frequency: 110.0 })} />);
      expect(screen.getByText("110.0 Hz")).toBeInTheDocument();
    });

    it("正のセントは +N cents と表示する", () => {
      render(<PitchDisplay pitch={makePitch({ cents: 12 })} />);
      expect(screen.getByText("+12 cents")).toBeInTheDocument();
    });

    it("負のセントは -N cents と表示する", () => {
      render(<PitchDisplay pitch={makePitch({ cents: -8 })} />);
      expect(screen.getByText("-8 cents")).toBeInTheDocument();
    });

    it("cents=0 のとき 0 cents と表示する", () => {
      render(<PitchDisplay pitch={makePitch({ cents: 0 })} />);
      expect(screen.getByText("0 cents")).toBeInTheDocument();
    });
  });

  describe("CentsGauge カラーコーディング", () => {
    it("|cents| ≤ 10 のとき emerald（ほぼ正確）", () => {
      const { container } = render(<PitchDisplay pitch={makePitch({ cents: 5 })} />);
      // CentsGauge のインジケーター dot を探す
      const dot = container.querySelector(".bg-emerald-500");
      expect(dot).toBeInTheDocument();
    });

    it("|cents| ≤ 25 のとき yellow（やや外れ）", () => {
      const { container } = render(<PitchDisplay pitch={makePitch({ cents: 20 })} />);
      const dot = container.querySelector(".bg-yellow-500");
      expect(dot).toBeInTheDocument();
    });

    it("|cents| > 25 のとき red（大きくずれ）", () => {
      const { container } = render(<PitchDisplay pitch={makePitch({ cents: 30 })} />);
      const dot = container.querySelector(".bg-red-500");
      expect(dot).toBeInTheDocument();
    });

    it("pitch=null のときインジケーター dot を表示しない", () => {
      const { container } = render(<PitchDisplay pitch={null} />);
      // active=false → CentsGauge はインジケーターを描画しない
      expect(container.querySelector(".bg-emerald-500")).not.toBeInTheDocument();
      expect(container.querySelector(".bg-yellow-500")).not.toBeInTheDocument();
      expect(container.querySelector(".bg-red-500")).not.toBeInTheDocument();
    });
  });
});
