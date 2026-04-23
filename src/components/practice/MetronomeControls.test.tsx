import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetronomeControls } from "./MetronomeControls";

const defaultProps = {
  bpm: 120,
  isPlaying: false,
  phase: "idle" as const,
  onBpmChange: vi.fn(),
  onStart: vi.fn(),
  onStop: vi.fn(),
};

describe("MetronomeControls", () => {
  it("start pending 中はマイク起動メッセージを表示する", () => {
    render(<MetronomeControls {...defaultProps} isStartPending />);
    expect(screen.getByText("🎤 マイクを起動しています…")).toBeInTheDocument();
  });

  it("start pending 中は Start ボタンを無効化する", () => {
    render(<MetronomeControls {...defaultProps} isStartPending />);
    expect(screen.getByRole("button", { name: "Starting…" })).toBeDisabled();
  });

  it("countdown 中は従来の準備メッセージを表示する", () => {
    render(<MetronomeControls {...defaultProps} phase="countdown" />);
    expect(screen.getByText("♩ 準備して…")).toBeInTheDocument();
  });
});
