import { Card, Md3Slider } from "../md3";

interface SensitivitySliderProps {
  clarityThreshold: number;
  onThresholdChange: (value: number) => void;
}

export function SensitivitySlider({
  clarityThreshold,
  onThresholdChange,
}: SensitivitySliderProps) {
  const percentage = Math.round(clarityThreshold * 100);

  return (
    <Card style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            font: "500 16px/1 Roboto, sans-serif",
            color: "var(--md-on-surface)",
          }}
        >
          Detection Sensitivity
        </div>
        <span
          style={{
            font: "500 14px/1 Roboto Mono, monospace",
            color: "var(--md-primary)",
            background: "var(--md-primary-container)",
            padding: "4px 10px",
            borderRadius: 8,
          }}
        >
          {percentage}%
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            font: "400 12px/1 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
            whiteSpace: "nowrap",
          }}
        >
          High
        </span>
        <Md3Slider
          min={50}
          max={98}
          value={percentage}
          onChange={(v) => onThresholdChange(v / 100)}
          ariaLabel="Detection sensitivity"
        />
        <span
          style={{
            font: "400 12px/1 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
            whiteSpace: "nowrap",
          }}
        >
          Low
        </span>
      </div>

      <p
        style={{
          margin: "12px 0 0",
          font: "400 12px/1.5 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
        }}
      >
        Lower values detect more notes but may include false positives. Default:
        85%
      </p>
    </Card>
  );
}
