import { Link } from "react-router-dom";
import { PresetCard } from "../components/practice/PresetCard";
import { CustomTabCard } from "../components/practice/CustomTabCard";
import { AssistChip, SectionLabel } from "../components/md3";
import { tabPresets } from "../data/tabPresets";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useCustomTabs } from "../hooks/useCustomTabs";

export function HomePage() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { tabs: customTabs, remove } = useCustomTabs();

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

      {/* Scale practice */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <SectionLabel>スケール練習</SectionLabel>
        <Link
          to="/practice/scale"
          style={{
            textDecoration: "none",
            background: "var(--md-secondary-container)",
            color: "var(--md-on-secondary-container)",
            borderRadius: 16,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 28 }}>🎼</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ font: "500 15px/1.3 Roboto, sans-serif" }}>
              キー × スケールを選んで練習
            </span>
            <span
              style={{
                font: "400 12px/1.4 Roboto, sans-serif",
                opacity: 0.8,
              }}
            >
              指板上に構成音表示 + ガイド付き上行・下行
            </span>
          </span>
        </Link>
      </div>

      {/* Rhythm practice */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <SectionLabel>リズム練習</SectionLabel>
        <Link
          to="/practice/rhythm"
          style={{
            textDecoration: "none",
            background: "var(--md-tertiary-container, var(--md-secondary-container))",
            color: "var(--md-on-tertiary-container, var(--md-on-secondary-container))",
            borderRadius: 16,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 28 }}>🥁</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ font: "500 15px/1.3 Roboto, sans-serif" }}>
              リズムパターンに特化した練習
            </span>
            <span
              style={{
                font: "400 12px/1.4 Roboto, sans-serif",
                opacity: 0.8,
              }}
            >
              8分 / 16分 / シャッフル / シンコペーション
            </span>
          </span>
        </Link>
      </div>

      {/* Preset list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <SectionLabel>プリセット</SectionLabel>
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

      {/* Custom tabs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <SectionLabel>マイタブ譜</SectionLabel>
          <Link
            to="/editor"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--md-primary)",
              color: "var(--md-on-primary)",
              padding: "8px 16px",
              borderRadius: 20,
              font: "500 13px/1 Roboto, sans-serif",
              marginBottom: 8,
            }}
          >
            + タブ譜を作る
          </Link>
        </div>
        {customTabs.length === 0 ? (
          <div
            style={{
              padding: "20px 16px",
              borderRadius: 16,
              background: "var(--md-surface-container-low)",
              border: "1px dashed var(--md-outline-variant)",
              color: "var(--md-on-surface-variant)",
              font: "400 13px/1.6 Roboto, sans-serif",
              textAlign: "center",
            }}
          >
            まだマイタブ譜がありません。「タブ譜を作る」から始めるか、プリセットをコピーして編集してみましょう。
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr",
              gap: 12,
            }}
          >
            {customTabs.map((preset) => (
              <CustomTabCard
                key={preset.id}
                preset={preset}
                onDelete={() => {
                  if (confirm(`「${preset.name}」を削除しますか？`)) {
                    remove(preset.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
