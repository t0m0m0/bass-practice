import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { TabPreset, TimeSignature } from "../types/practice";
import { tabPresets } from "../data/tabPresets";
import {
  cloneAsCustom,
  createEmptyPreset,
  resizeNotes,
} from "../lib/customTabs";
import { findCustomTab, useCustomTabs } from "../hooks/useCustomTabs";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { TabGrid } from "../components/editor/TabGrid";
import { AsciiTabDisplay } from "../components/practice/AsciiTabDisplay";
import { FilledButton, OutlinedButton, SectionLabel } from "../components/md3";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const clonePresetId = searchParams.get("clone");
  const navigate = useNavigate();
  const { tabs, upsert, remove } = useCustomTabs();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Initial preset is derived from URL params. We read the store synchronously
  // via `findCustomTab` (not the `tabs` snapshot) to avoid depending on the
  // order in which components subscribe. The draft is then owned by local
  // state and only reset when the route `id` changes.
  const [draft, setDraft] = useState<TabPreset>(() =>
    buildInitialPreset(id, clonePresetId),
  );
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Reset draft when the route id changes (new/edit switch). Using the
  // "changing key during render" pattern rather than useEffect avoids a
  // wasted render and the cascading-setState lint warning.
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setDraft(buildInitialPreset(id, clonePresetId));
    setSaveMsg(null);
  }

  const updateField = <K extends keyof TabPreset>(key: K, value: TabPreset[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const updateTimeSignature = (patch: Partial<TimeSignature>) => {
    setDraft((d) => {
      const ts = { ...d.timeSignature, ...patch };
      return {
        ...d,
        timeSignature: ts,
        notes: resizeNotes(d.notes, ts, d.measures),
      };
    });
  };

  const updateMeasures = (measures: number) => {
    setDraft((d) => ({
      ...d,
      measures,
      notes: resizeNotes(d.notes, d.timeSignature, measures),
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      setSaveMsg("タイトルを入力してください");
      return;
    }
    upsert(draft);
    setSaveMsg("保存しました");
    // Navigate to edit URL so subsequent saves update in-place.
    if (!id) navigate(`/editor/${draft.id}`, { replace: true });
  };

  const handleDelete = () => {
    if (!id) return;
    if (!confirm("このタブ譜を削除しますか？")) return;
    remove(id);
    navigate("/");
  };

  const handlePractice = () => {
    upsert(draft);
    navigate(`/practice/tab/${draft.id}`);
  };

  const isExisting = !!id && tabs.some((t) => t.id === id);

  return (
    <div
      style={{
        padding: isDesktop ? "32px 32px" : "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link
          to="/"
          style={{
            color: "var(--md-primary)",
            textDecoration: "none",
            font: "500 13px/1 Roboto, sans-serif",
          }}
        >
          ← ホーム
        </Link>
      </div>

      <SectionLabel>メタ情報</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "2fr 1fr 1fr 1fr 1fr" : "1fr 1fr",
          gap: 12,
        }}
      >
        <LabeledInput
          label="タイトル"
          value={draft.name}
          onChange={(v) => updateField("name", v)}
        />
        <LabeledNumber
          label="BPM"
          value={draft.bpm}
          min={30}
          max={300}
          onChange={(v) => updateField("bpm", v)}
        />
        <LabeledNumber
          label="拍/小節"
          value={draft.timeSignature.beatsPerMeasure}
          min={1}
          max={12}
          onChange={(v) => updateTimeSignature({ beatsPerMeasure: v })}
        />
        <LabeledNumber
          label="音符値"
          value={draft.timeSignature.beatUnit}
          min={1}
          max={16}
          onChange={(v) => updateTimeSignature({ beatUnit: v })}
        />
        <LabeledNumber
          label="小節数"
          value={draft.measures}
          min={1}
          max={32}
          onChange={updateMeasures}
        />
      </div>

      <LabeledInput
        label="説明"
        value={draft.description}
        onChange={(v) => updateField("description", v)}
      />

      <SectionLabel>プレビュー</SectionLabel>
      <AsciiTabDisplay
        preset={draft}
        currentBeat={-1}
        isPlaying={false}
        beatWidth={isDesktop ? 56 : 44}
      />

      <SectionLabel>グリッド編集</SectionLabel>
      <TabGrid
        preset={draft}
        onNotesChange={(notes) => updateField("notes", notes)}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <FilledButton label="💾 保存" onClick={handleSave} />
        <OutlinedButton
          label="🎸 保存して練習"
          onClick={handlePractice}
          disabled={!draft.name.trim()}
        />
        {isExisting && (
          <OutlinedButton
            label="🗑️ 削除"
            onClick={handleDelete}
            style={{ color: "#ef5350", borderColor: "#ef535066" }}
          />
        )}
        {saveMsg && (
          <span
            style={{
              alignSelf: "center",
              font: "400 13px/1 Roboto, sans-serif",
              color: "var(--md-on-surface-variant)",
            }}
          >
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function LabeledInput({ label, value, onChange }: LabeledInputProps) {
  return (
    <label
      style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}
    >
      <span
        style={{
          font: "500 11px/1 Roboto, sans-serif",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "var(--md-on-surface-variant)",
        }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

interface LabeledNumberProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function LabeledNumber({ label, value, min, max, onChange }: LabeledNumberProps) {
  // Keep a local string buffer so the user can transiently clear the field
  // or type partial values without getting clamped on every keystroke.
  const [text, setText] = useState(String(value));

  // Sync buffer when the committed value changes from outside (e.g. resize).
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) {
      setText(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, Math.trunc(n)));
    setText(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          font: "500 11px/1 Roboto, sans-serif",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "var(--md-on-surface-variant)",
        }}
      >
        {label}
      </span>
      <input
        type="number"
        min={min}
        max={max}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={inputStyle}
      />
    </label>
  );
}

function buildInitialPreset(
  id: string | undefined,
  clonePresetId: string | null,
): TabPreset {
  if (id) {
    const existing = findCustomTab(id);
    if (existing) return existing;
  }
  if (clonePresetId) {
    const src =
      tabPresets.find((p) => p.id === clonePresetId) ??
      findCustomTab(clonePresetId);
    if (src) return cloneAsCustom(src);
  }
  return createEmptyPreset();
}

const inputStyle: CSSProperties = {
  background: "var(--md-surface-container)",
  border: "1px solid var(--md-outline-variant)",
  color: "var(--md-on-surface)",
  borderRadius: 8,
  padding: "10px 12px",
  font: "400 14px/1.2 Roboto, sans-serif",
  width: "100%",
  boxSizing: "border-box",
};
