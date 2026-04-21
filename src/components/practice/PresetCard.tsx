import { useState } from "react";
import { Link } from "react-router-dom";
import type { TabPreset } from "../../types/practice";
import { Tag } from "../md3";

interface PresetCardProps {
  preset: TabPreset;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  "c-major-scale": "初級",
  "blues-bassline": "中級",
  "waltz-pattern": "中級",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  初級: "#4ecdc4",
  中級: "#f9a825",
  上級: "#ef5350",
};

export function PresetCard({ preset }: PresetCardProps) {
  const [hovered, setHovered] = useState(false);
  const diff = DIFFICULTY_LABEL[preset.id] ?? "初級";
  const diffColor = DIFFICULTY_COLOR[diff] ?? "#4ecdc4";

  return (
    <Link
      to={`/practice/tab/${preset.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textDecoration: "none",
        background: hovered
          ? "var(--md-surface-container-highest)"
          : "var(--md-surface-container-high)",
        borderRadius: 16,
        padding: "20px 20px 16px",
        transition: "background 0.15s, transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered
          ? "0 4px 12px rgba(0,0,0,0.3)"
          : "0 1px 3px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        color: "var(--md-on-surface)",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            font: "500 18px/1.2 Roboto, sans-serif",
            color: hovered ? "var(--md-primary)" : "var(--md-on-surface)",
            transition: "color 0.15s",
          }}
        >
          {preset.name}
        </h3>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            height: 24,
            padding: "0 10px",
            borderRadius: 6,
            background: diffColor + "22",
            color: diffColor,
            font: "500 11px/1 Roboto, sans-serif",
            letterSpacing: 0.5,
          }}
        >
          {diff}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          font: "400 14px/1.5 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
        }}
      >
        {preset.description}
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        <Tag label={`${preset.bpm} BPM`} />
        <Tag
          label={`${preset.timeSignature.beatsPerMeasure}/${preset.timeSignature.beatUnit}`}
        />
        <Tag label={`${preset.measures} 小節`} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >
        <span
          style={{
            font: "500 13px/1 Roboto, sans-serif",
            color: "var(--md-primary)",
            letterSpacing: 0.5,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
          }}
        >
          練習を始める →
        </span>
      </div>
    </Link>
  );
}
