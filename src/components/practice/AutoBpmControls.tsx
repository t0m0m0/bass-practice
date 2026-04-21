import type { ReactNode } from "react";
import type { AutoBpmConfig } from "../../hooks/useAutoBpm";
import type { TabSessionPhase } from "../../types/practice";
import { Card, Md3Slider } from "../md3";

interface AutoBpmControlsProps {
  config: AutoBpmConfig;
  currentBpm: number;
  startBpm: number;
  levelUps: number;
  notification: string | null;
  phase: TabSessionPhase;
  onEnabledChange: (enabled: boolean) => void;
  onThresholdChange: (threshold: number) => void;
  onIncrementChange: (increment: number) => void;
  onMaxBpmChange: (maxBpm: number) => void;
}

export function AutoBpmControls({
  config,
  currentBpm,
  startBpm,
  levelUps,
  notification,
  phase,
  onEnabledChange,
  onThresholdChange,
  onIncrementChange,
  onMaxBpmChange,
}: AutoBpmControlsProps) {
  const active = phase === "playing" || phase === "countdown";
  // Allow toggling OFF mid-session (safe: just stops future BPM UPs).
  // Only lock the toggle when it would turn ON during a live session,
  // so the user can't enable auto-ramp halfway through a loop.
  const toggleLocked = active && !config.enabled;

  return (
    <Card style={{ padding: 20 }}>
      <Header
        enabled={config.enabled}
        locked={toggleLocked}
        marginBottom={config.enabled ? 16 : 0}
        onToggle={() => onEnabledChange(!config.enabled)}
      />

      {config.enabled && (
        <>
          {notification && <NotificationBanner message={notification} />}

          {active && (
            <BpmProgress
              startBpm={startBpm}
              currentBpm={currentBpm}
              maxBpm={config.maxBpm}
              levelUps={levelUps}
            />
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: active ? 0.5 : 1,
              pointerEvents: active ? "none" : "auto",
            }}
          >
            <SettingSlider
              label="Hit Rate 閾値"
              valueText={`${Math.round(config.hitRateThreshold * 100)}%`}
              min={50}
              max={100}
              step={5}
              value={Math.round(config.hitRateThreshold * 100)}
              onChange={(v) => onThresholdChange(v / 100)}
              disabled={active}
              ariaLabel="Hit Rate Threshold"
            />
            <SettingSlider
              label="BPM 増加量"
              valueText={`+${config.bpmIncrement}`}
              min={1}
              max={20}
              step={1}
              value={config.bpmIncrement}
              onChange={onIncrementChange}
              disabled={active}
              ariaLabel="BPM Increment"
            />
            <SettingSlider
              label="BPM 上限"
              valueText={String(config.maxBpm)}
              min={40}
              max={300}
              step={5}
              value={config.maxBpm}
              onChange={onMaxBpmChange}
              disabled={active}
              ariaLabel="Max BPM"
            />
          </div>
        </>
      )}
    </Card>
  );
}

// ---------- sub-components ----------

interface HeaderProps {
  enabled: boolean;
  locked: boolean;
  marginBottom: number;
  onToggle: () => void;
}

function Header({ enabled, locked, marginBottom, onToggle }: HeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom,
      }}
    >
      <div
        style={{
          font: "500 16px/1 Roboto, sans-serif",
          color: "var(--md-on-surface)",
        }}
      >
        Auto BPM Up
      </div>
      <ToggleSwitch enabled={enabled} locked={locked} onToggle={onToggle} />
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  locked: boolean;
  onToggle: () => void;
}

function ToggleSwitch({ enabled, locked, onToggle }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Auto BPM Up"
      disabled={locked}
      onClick={onToggle}
      style={{
        position: "relative",
        width: 52,
        height: 32,
        borderRadius: 16,
        border: enabled ? "none" : "2px solid var(--md-outline)",
        background: enabled
          ? "var(--md-primary)"
          : "var(--md-surface-container-highest)",
        cursor: locked ? "not-allowed" : "pointer",
        opacity: locked ? 0.5 : 1,
        padding: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: enabled ? 4 : 6,
          left: enabled ? 24 : 6,
          width: enabled ? 24 : 16,
          height: enabled ? 24 : 16,
          borderRadius: 12,
          background: enabled ? "var(--md-on-primary)" : "var(--md-outline)",
          transition: "left 0.2s, width 0.2s, height 0.2s, top 0.2s",
        }}
      />
    </button>
  );
}

function NotificationBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background:
          "color-mix(in srgb, var(--md-primary) 10%, transparent)",
        border:
          "1px solid color-mix(in srgb, var(--md-primary) 40%, transparent)",
        color: "var(--md-primary)",
        borderRadius: 12,
        padding: "10px 16px",
        font: "600 14px/1.5 Roboto, sans-serif",
        textAlign: "center",
        marginBottom: 16,
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      {message}
    </div>
  );
}

interface BpmProgressProps {
  startBpm: number;
  currentBpm: number;
  maxBpm: number;
  levelUps: number;
}

function BpmProgress({
  startBpm,
  currentBpm,
  maxBpm,
  levelUps,
}: BpmProgressProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginBottom: 16,
        padding: "12px 0",
      }}
    >
      <BpmStage label="Start" value={startBpm} />
      <Arrow />
      <BpmStage label="Current" value={currentBpm} emphasis />
      <Arrow />
      <BpmStage label="Max" value={maxBpm} />
      {levelUps > 0 && <LevelUpBadge count={levelUps} />}
    </div>
  );
}

function BpmStage({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  const color = emphasis
    ? "var(--md-primary)"
    : "var(--md-on-surface-variant)";
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          font: "400 11px/1 Roboto, sans-serif",
          color,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          font: emphasis
            ? "700 24px/1 Roboto, sans-serif"
            : "700 20px/1 Roboto, sans-serif",
          color,
        }}
        className="tabular-nums"
      >
        {value}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div
      style={{
        font: "400 18px/1 Roboto, sans-serif",
        color: "var(--md-on-surface-variant)",
      }}
    >
      →
    </div>
  );
}

function LevelUpBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        marginLeft: 8,
        padding: "4px 10px",
        borderRadius: 12,
        background:
          "color-mix(in srgb, var(--md-primary) 10%, transparent)",
        color: "var(--md-primary)",
        font: "600 12px/1.5 Roboto, sans-serif",
      }}
    >
      +{count}
    </span>
  );
}

interface SettingSliderProps {
  label: ReactNode;
  valueText: ReactNode;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  ariaLabel: string;
}

function SettingSlider({
  label,
  valueText,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  ariaLabel,
}: SettingSliderProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            font: "400 13px/1 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            font: "500 13px/1 Roboto, sans-serif",
            color: "var(--md-on-surface)",
          }}
          className="tabular-nums"
        >
          {valueText}
        </span>
      </div>
      <Md3Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
