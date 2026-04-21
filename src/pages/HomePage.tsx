import { PresetCard } from "../components/practice/PresetCard";
import { AssistChip, SectionLabel } from "../components/md3";
import { tabPresets } from "../data/tabPresets";
import { useMediaQuery } from "../hooks/useMediaQuery";

export function HomePage() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <div
      style={{
        padding: isDesktop ? "32px 32px" : "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: "var(--md-primary-container)",
          borderRadius: 24,
          padding: isDesktop ? "32px 40px 28px" : "24px 24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            font: "300 13px/1 Roboto, sans-serif",
            color: "var(--md-on-primary-container)",
            opacity: 0.8,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Bass Practice
        </div>
        <div
          style={{
            font: `400 ${isDesktop ? 26 : 22}px/1.3 Roboto, sans-serif`,
            color: "var(--md-on-primary-container)",
          }}
        >
          タブ譜に合わせて演奏し、
          <br />
          タイミングの正確さを磨こう。
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <AssistChip label="🎸 メトロノーム付き" />
          <AssistChip label="🎤 マイク検知" />
        </div>
      </div>

      {/* Preset list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <SectionLabel>タブ譜を選ぶ</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
            gap: 12,
          }}
        >
          {tabPresets.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      </div>
    </div>
  );
}
