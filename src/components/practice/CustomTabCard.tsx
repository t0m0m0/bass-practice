import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { TabPreset } from "../../types/practice";
import { Tag } from "../md3";

interface CustomTabCardProps {
  preset: TabPreset;
  onDelete: () => void;
}

export function CustomTabCard({ preset, onDelete }: CustomTabCardProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "var(--md-surface-container-highest)"
          : "var(--md-surface-container-high)",
        borderRadius: 16,
        padding: "20px 20px 16px",
        transition: "background 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        color: "var(--md-on-surface)",
        position: "relative",
      }}
    >
      <Link
        to={`/practice/tab/${preset.id}`}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          textDecoration: "none",
        }}
        aria-label={`${preset.name} で練習`}
      />
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
          }}
        >
          {preset.name || "(無題)"}
        </h3>
        <Tag label="マイタブ譜" style={{ background: "var(--md-tertiary-container, #4a4458)", color: "var(--md-on-tertiary-container, #eaddff)" }} />
      </div>

      {preset.description && (
        <p
          style={{
            margin: 0,
            font: "400 14px/1.5 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
          }}
        >
          {preset.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
        <Tag label={`${preset.bpm} BPM`} />
        <Tag
          label={`${preset.timeSignature.beatsPerMeasure}/${preset.timeSignature.beatUnit}`}
        />
        <Tag label={`${preset.measures} 小節`} />
        <Tag label={`${preset.notes.length} ノート`} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        <button
          onClick={() => navigate(`/editor/${preset.id}`)}
          style={btnStyle}
        >
          ✏️ 編集
        </button>
        <button
          onClick={onDelete}
          style={{ ...btnStyle, color: "#ef5350" }}
        >
          🗑️ 削除
        </button>
      </div>
    </div>
  );
}

const btnStyle: CSSProperties = {
  background: "transparent",
  border: "1px solid var(--md-outline-variant)",
  color: "var(--md-on-surface)",
  padding: "6px 12px",
  borderRadius: 16,
  font: "500 12px/1 Roboto, sans-serif",
  cursor: "pointer",
};
