import { useEffect, useRef } from "react";
import type { TabSessionPhase } from "../../types/practice";
import { Card, FilledButton, Md3Slider, OutlinedButton } from "../md3";

interface MetronomeControlsProps {
  bpm: number;
  isPlaying: boolean;
  phase: TabSessionPhase;
  isStartPending?: boolean;
  onBpmChange: (bpm: number) => void;
  onStart: () => void;
  onStop: () => void;
}

export function MetronomeControls({
  bpm,
  phase,
  isStartPending = false,
  onBpmChange,
  onStart,
  onStop,
}: MetronomeControlsProps) {
  const active = phase === "playing" || phase === "countdown";
  const beatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const interval = (60 / bpm) * 1000;
    const tick = () => {
      const el = beatRef.current;
      if (!el) return;
      el.style.transform = "scale(1.15)";
      el.style.background = "var(--md-primary)";
      setTimeout(() => {
        if (!beatRef.current) return;
        beatRef.current.style.transform = "scale(1)";
        beatRef.current.style.background = "var(--md-primary-container)";
      }, 80);
    };
    const t = setInterval(tick, interval);
    return () => clearInterval(t);
  }, [active, bpm]);

  return (
    <Card style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            font: "500 16px/1 Roboto, sans-serif",
            color: "var(--md-on-surface)",
          }}
        >
          メトロノーム
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            ref={beatRef}
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              background: active
                ? "var(--md-primary-container)"
                : "var(--md-surface-container-highest)",
              transition: "background 0.05s, transform 0.05s",
            }}
          />
          <span
            style={{
              font: "700 28px/1 Roboto, sans-serif",
              color: "var(--md-on-surface)",
              letterSpacing: -1,
            }}
            className="tabular-nums"
          >
            {bpm}
          </span>
          <span
            style={{
              font: "400 14px/1 Roboto, sans-serif",
              color: "var(--md-on-surface-variant)",
            }}
          >
            BPM
          </span>
        </div>
      </div>

      <Md3Slider
        min={20}
        max={300}
        value={bpm}
        onChange={onBpmChange}
        disabled={active}
        ariaLabel="BPM"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          marginBottom: 20,
        }}
      >
        <span
          style={{
            font: "400 11px/1 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
          }}
        >
          20
        </span>
        <span
          style={{
            font: "400 11px/1 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
          }}
        >
          300
        </span>
      </div>

      {(phase === "countdown" || isStartPending) && (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0",
            font: "500 16px/1 Roboto, sans-serif",
            color: "#f9a825",
            marginBottom: 12,
          }}
        >
          {isStartPending ? "🎤 マイクを起動しています…" : "♩ 準備して…"}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        {phase === "idle" || phase === "finished" ? (
          <FilledButton
            label={isStartPending ? "Starting…" : phase === "finished" ? "Restart" : "Start"}
            icon={phase === "finished" ? "↺" : "▶"}
            onClick={onStart}
            disabled={isStartPending}
            style={{ flex: 1, justifyContent: "center" }}
          />
        ) : (
          <OutlinedButton
            label="Stop"
            icon="⏹"
            onClick={onStop}
            style={{ flex: 1, justifyContent: "center" }}
          />
        )}
      </div>
    </Card>
  );
}
