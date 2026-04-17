import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioMeter } from "./AudioMeter";

describe("AudioMeter", () => {
  describe("入力レベル表示", () => {
    it("レベル 0 のとき 0% と表示する", () => {
      render(<AudioMeter level={0} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("レベルは 5 倍に正規化して表示する（0.1 → 50%）", () => {
      render(<AudioMeter level={0.1} />);
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("正規化後の値は 100% でキャップされる（0.5 → 100%）", () => {
      render(<AudioMeter level={0.5} />);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("ラベルテキスト「Input Level」を表示する", () => {
      render(<AudioMeter level={0} />);
      expect(screen.getByText("Input Level")).toBeInTheDocument();
    });
  });

  describe("バーの幅", () => {
    it("level=0 のときバーの width は 0%", () => {
      const { container } = render(<AudioMeter level={0} />);
      const bar = container.querySelector("[style]");
      expect(bar).toHaveStyle({ width: "0%" });
    });

    it("level=0.1 のときバーの width は 50%", () => {
      const { container } = render(<AudioMeter level={0.1} />);
      const bar = container.querySelector("[style]");
      expect(bar).toHaveStyle({ width: "50%" });
    });

    it("level=1 のときバーの width は 100%（キャップ）", () => {
      const { container } = render(<AudioMeter level={1} />);
      const bar = container.querySelector("[style]");
      expect(bar).toHaveStyle({ width: "100%" });
    });
  });

  describe("カラーコーディング", () => {
    it("低レベル（normalizedLevel ≤ 0.5）は emerald 色", () => {
      const { container } = render(<AudioMeter level={0.05} />); // 0.05 * 5 = 0.25
      const bar = container.querySelector("[style]");
      expect(bar?.className).toContain("bg-emerald-500");
    });

    it("中レベル（0.5 < normalizedLevel ≤ 0.8）は yellow 色", () => {
      const { container } = render(<AudioMeter level={0.12} />); // 0.12 * 5 = 0.6
      const bar = container.querySelector("[style]");
      expect(bar?.className).toContain("bg-yellow-500");
    });

    it("高レベル（normalizedLevel > 0.8）は red 色", () => {
      const { container } = render(<AudioMeter level={0.2} />); // 0.2 * 5 = 1.0 > 0.8
      const bar = container.querySelector("[style]");
      expect(bar?.className).toContain("bg-red-500");
    });
  });
});
