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

  return (
    <Card style={{ padding: 20 }}>
      {/* Header with toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: config.enabled ? 16 : 0,
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
        <button
          type="button"
          role="switch"
          aria-checked={config.enabled}
          aria-label="Auto BPM Up"
          disabled={active}
          onClick={() => onEnabledChange(!config.enabled)}
          style={{
            position: "relative",
            width: 52,
            height: 32,
            borderRadius: 16,
            border: config.enabled
              ? "none"
              : "2px solid var(--md-outline)",
            background: config.enabled
              ? "var(--md-primary)"
              : "var(--md-surface-container-highest)",
            cursor: active ? "not-allowed" : "pointer",
            opacity: active ? 0.5 : 1,
            padding: 0,
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: config.enabled ? 4 : 6,
              left: config.enabled ? 24 : 6,
              width: config.enabled ? 24 : 16,
              height: config.enabled ? 24 : 16,
              borderRadius: 12,
              background: config.enabled
                ? "var(--md-on-primary)"
                : "var(--md-outline)",
              transition: "left 0.2s, width 0.2s, height 0.2s, top 0.2s",
            }}
          />
        </button>
      </div>

      {config.enabled && (
        <>
          {/* Notification banner */}
          {notification && (
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
              {notification}
            </div>
          )}

          {/* BPM progress display */}
          {active && (
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
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    font: "400 11px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface-variant)",
                    marginBottom: 4,
                  }}
                >
                  Start
                </div>
                <div
                  style={{
                    font: "700 20px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface-variant)",
                  }}
                  className="tabular-nums"
                >
                  {startBpm}
                </div>
              </div>
              <div
                style={{
                  font: "400 18px/1 Roboto, sans-serif",
                  color: "var(--md-on-surface-variant)",
                }}
              >
                →
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    font: "400 11px/1 Roboto, sans-serif",
                    color: "var(--md-primary)",
                    marginBottom: 4,
                  }}
                >
                  Current
                </div>
                <div
                  style={{
                    font: "700 24px/1 Roboto, sans-serif",
                    color: "var(--md-primary)",
                  }}
                  className="tabular-nums"
                >
                  {currentBpm}
                </div>
              </div>
              <div
                style={{
                  font: "400 18px/1 Roboto, sans-serif",
                  color: "var(--md-on-surface-variant)",
                }}
              >
                →
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    font: "400 11px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface-variant)",
                    marginBottom: 4,
                  }}
                >
                  Max
                </div>
                <div
                  style={{
                    font: "700 20px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface-variant)",
                  }}
                  className="tabular-nums"
                >
                  {config.maxBpm}
                </div>
              </div>
              {levelUps > 0 && (
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
                  +{levelUps}
                </span>
              )}
            </div>
          )}

          {/* Settings (disabled while playing) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: active ? 0.5 : 1,
              pointerEvents: active ? "none" : "auto",
            }}
          >
            {/* Hit Rate Threshold */}
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
                  Hit Rate 閾値
                </span>
                <span
                  style={{
                    font: "500 13px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface)",
                  }}
                  className="tabular-nums"
                >
                  {Math.round(config.hitRateThreshold * 100)}%
                </span>
              </div>
              <Md3Slider
                min={50}
                max={100}
                step={5}
                value={Math.round(config.hitRateThreshold * 100)}
                onChange={(v) => onThresholdChange(v / 100)}
                disabled={active}
                ariaLabel="Hit Rate Threshold"
              />
            </div>

            {/* BPM Increment */}
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
                  BPM 増加量
                </span>
                <span
                  style={{
                    font: "500 13px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface)",
                  }}
                  className="tabular-nums"
                >
                  +{config.bpmIncrement}
                </span>
              </div>
              <Md3Slider
                min={1}
                max={20}
                step={1}
                value={config.bpmIncrement}
                onChange={onIncrementChange}
                disabled={active}
                ariaLabel="BPM Increment"
              />
            </div>

            {/* Max BPM */}
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
                  BPM 上限
                </span>
                <span
                  style={{
                    font: "500 13px/1 Roboto, sans-serif",
                    color: "var(--md-on-surface)",
                  }}
                  className="tabular-nums"
                >
                  {config.maxBpm}
                </span>
              </div>
              <Md3Slider
                min={40}
                max={300}
                step={5}
                value={config.maxBpm}
                onChange={onMaxBpmChange}
                disabled={active}
                ariaLabel="Max BPM"
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
