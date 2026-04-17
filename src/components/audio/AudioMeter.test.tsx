import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioMeter } from "./AudioMeter";

describe("AudioMeter", () => {
  describe("入力レベル表示", () => {
    it("レベル 0 のとき 0% と表示する", () => {
      render(<AudioMeter level={0} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("レベル 1 のとき 100% と表示する（0dB）", () => {
      render(<AudioMeter level={1} />);
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("レベル 0.001 のとき 0% と表示する（-60dB 以下）", () => {
      render(<AudioMeter level={0.001} />);
      expect(screen.getByText("0%")).toBeInTheDocument();
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

    it("level=1 のときバーの width は 100%（0dB）", () => {
      const { container } = render(<AudioMeter level={1} />);
      const bar = container.querySelector("[style]");
      expect(bar).toHaveStyle({ width: "100%" });
    });

    it("level=0.001 のときバーの width は 0%（-60dB 以下）", () => {
      const { container } = render(<AudioMeter level={0.001} />);
      const bar = container.querySelector("[style]");
      expect(bar).toHaveStyle({ width: "0%" });
    });
  });

  describe("カラーコーディング", () => {
    it("低レベル（normalizedLevel ≤ 0.5）は emerald 色", () => {
      // level=0.01 → -40dB → (−40+60)/60 ≈ 0.33
      const { container } = render(<AudioMeter level={0.01} />);
      const bar = container.querySelector("[style]");
      expect(bar?.className).toContain("bg-emerald-500");
    });

    it("中レベル（0.5 < normalizedLevel ≤ 0.8）は yellow 色", () => {
      // level=0.1 → -20dB → (−20+60)/60 ≈ 0.67
      const { container } = render(<AudioMeter level={0.1} />);
      const bar = container.querySelector("[style]");
      expect(bar?.className).toContain("bg-yellow-500");
    });

    it("高レベル（normalizedLevel > 0.8）は red 色", () => {
      // level=0.5 → ≈ -6dB → (−6+60)/60 ≈ 0.90
      const { container } = render(<AudioMeter level={0.5} />);
      const bar = container.querySelector("[style]");
      expect(bar?.className).toContain("bg-red-500");
    });
  });
});
