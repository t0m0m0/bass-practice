import { useMemo, useState, useRef, useEffect } from "react";
import { Note } from "tonal";
import { AudioSetup } from "../components/audio/AudioSetup";
import { Fretboard } from "../components/scale/Fretboard";
import { Card, FilledButton, OutlinedButton, SectionLabel } from "../components/md3";
import { useAudioInput } from "../hooks/useAudioInput";
import { usePitchDetection } from "../hooks/usePitchDetection";
import { useMediaQuery } from "../hooks/useMediaQuery";
import {
  KEYS,
  SCALE_TYPES,
  getScalePitchClasses,
  getScaleFretPositions,
  isPitchClassInScale,
  buildAscDescSequence,
  normalizePitchClass,
  type Key,
  type ScaleTypeId,
} from "../lib/music/scales";
import type { FretPosition } from "../types/music";

type PositionPreset = "low" | "high";

const POSITION_RANGES: Record<PositionPreset, { start: number; end: number; label: string }> = {
  low: { start: 0, end: 7, label: "ローポジション (0-7)" },
  high: { start: 5, end: 12, label: "ハイポジション (5-12)" },
};

export function ScalePracticePage() {
  const audio = useAudioInput();
  const { pitch } = usePitchDetection(audio.engine, audio.isListening);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [keyRoot, setKeyRoot] = useState<Key>("C");
  const [scaleType, setScaleType] = useState<ScaleTypeId>("major");
  const [position, setPosition] = useState<PositionPreset>("low");
  const [isGuided, setIsGuided] = useState(false);
  const [seqIndex, setSeqIndex] = useState(0);
  const [hitCount, setHitCount] = useState(0);

  const scale = useMemo(
    () => getScalePitchClasses(keyRoot, scaleType),
    [keyRoot, scaleType],
  );

  const { start, end } = POSITION_RANGES[position];

  const positions = useMemo(
    () => getScaleFretPositions(scale.pitchClasses, start, end),
    [scale.pitchClasses, start, end],
  );

  const sequence = useMemo(
    () => buildAscDescSequence(scale.pitchClasses, start >= 5 ? 2 : 1),
    [scale.pitchClasses, start],
  );

  // Reset guided progress when settings change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeqIndex(0);
    setHitCount(0);
  }, [keyRoot, scaleType, position, isGuided]);

  const currentTarget = isGuided ? sequence[seqIndex] : undefined;
  const currentTargetPc = currentTarget
    ? normalizePitchClass(Note.pitchClass(currentTarget))
    : undefined;
  const targetFretPos = useMemo<FretPosition | null>(() => {
    if (!currentTarget) return null;
    const targetMidi = Note.midi(currentTarget);
    if (targetMidi == null) return null;
    // Prefer exact midi match, else any position with same pc closest in range
    let best: FretPosition | null = null;
    let bestDist = Infinity;
    for (const p of positions) {
      const m = Note.midi(p.note);
      if (m == null) continue;
      if (m === targetMidi) return p;
      if (p.pitchClass === Note.pitchClass(currentTarget)) {
        const d = Math.abs(m - targetMidi);
        if (d < bestDist) {
          bestDist = d;
          best = p;
        }
      }
    }
    return best;
  }, [currentTarget, positions]);

  // Detected pitch (normalized to sharp convention for reliable comparison)
  const detectedPcRaw = pitch?.detected ? pitch.pitchClass : null;
  const detectedPc = detectedPcRaw ? normalizePitchClass(detectedPcRaw) : null;
  const isInScale = detectedPc
    ? isPitchClassInScale(detectedPc, scale.pitchClasses)
    : false;

  // Advance guided progress when the detected pitch (from the external audio
  // stream) matches the current target. The audio pipeline is an external
  // system, so an effect is appropriate here.
  //
  // 連続して同じピッチクラスがターゲットになる場合 (例: 上行→下行で C,B,A... の
  // 折返し付近) に一度の発音で複数ステップ進んでしまわないよう、進行後は
  // 「音が途切れる」か「別のピッチクラスが検出される」までアーム解除する。
  const armedRef = useRef(true);
  useEffect(() => {
    if (!isGuided) {
      armedRef.current = true;
      return;
    }
    if (!detectedPc) {
      // 音が切れた → 次の発音を受け付ける
      armedRef.current = true;
      return;
    }
    if (!currentTargetPc) return;
    if (!armedRef.current) {
      // アーム解除中: 違うピッチクラスに変わったら再アーム
      if (detectedPc !== currentTargetPc) armedRef.current = true;
      return;
    }
    if (detectedPc !== currentTargetPc) return;
    armedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHitCount((c) => c + 1);
    setSeqIndex((i) => (i + 1) % sequence.length);
  }, [detectedPc, currentTargetPc, isGuided, sequence.length]);

  return (
    <div
      style={{
        padding: isDesktop ? "24px 32px" : "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Card style={{ padding: 16 }}>
        <SectionLabel>スケール設定</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr",
            gap: 12,
            marginTop: 8,
          }}
        >
          <LabeledSelect
            label="キー"
            value={keyRoot}
            onChange={(v) => setKeyRoot(v as Key)}
            options={KEYS.map((k) => ({ value: k, label: k }))}
          />
          <LabeledSelect
            label="スケール"
            value={scaleType}
            onChange={(v) => setScaleType(v as ScaleTypeId)}
            options={SCALE_TYPES.map((s) => ({ value: s.id, label: s.label }))}
          />
          <LabeledSelect
            label="ポジション"
            value={position}
            onChange={(v) => setPosition(v as PositionPreset)}
            options={(Object.keys(POSITION_RANGES) as PositionPreset[]).map(
              (k) => ({ value: k, label: POSITION_RANGES[k].label }),
            )}
          />
        </div>
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span style={{ font: "500 13px/1 Roboto, sans-serif", color: "var(--md-on-surface-variant)" }}>
            構成音:
          </span>
          {scale.pitchClasses.map((pc) => (
            <span
              key={pc}
              style={{
                padding: "4px 10px",
                borderRadius: 12,
                background:
                  pc === scale.pitchClasses[0]
                    ? "var(--md-primary-container)"
                    : "var(--md-secondary-container)",
                color:
                  pc === scale.pitchClasses[0]
                    ? "var(--md-on-primary-container)"
                    : "var(--md-on-secondary-container)",
                font: "500 12px/1 Roboto, sans-serif",
              }}
            >
              {pc}
            </span>
          ))}
        </div>
      </Card>

      <Fretboard
        positions={positions}
        rootPitchClass={scale.pitchClasses[0]}
        startFret={start}
        endFret={end}
        highlightPosition={isGuided ? targetFretPos : null}
        detectedPitchClass={detectedPc}
      />

      <Card style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {isGuided ? (
            <OutlinedButton label="ガイド終了" onClick={() => setIsGuided(false)} />
          ) : (
            <FilledButton label="ガイド開始 (上行→下行)" onClick={() => setIsGuided(true)} />
          )}
          {isGuided && (
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Stat label="次の音" value={currentTarget ?? "-"} accent />
              <Stat label="進捗" value={`${seqIndex + 1} / ${sequence.length}`} />
              <Stat label="ヒット" value={String(hitCount)} />
            </div>
          )}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Stat
            label="検出中"
            value={pitch?.detected ? pitch.note : "-"}
          />
          <Stat
            label="判定"
            value={
              !detectedPc ? "-" : isInScale ? "✅ スケール内" : "❌ スケール外"
            }
            accent={isInScale}
          />
        </div>
      </Card>

      <AudioSetup
        isListening={audio.isListening}
        isStarting={audio.isStarting}
        isPermissionGranted={audio.isPermissionGranted}
        inputLevel={audio.inputLevel}
        availableDevices={audio.availableDevices}
        selectedDeviceId={audio.selectedDeviceId}
        error={audio.error}
        onStart={audio.start}
        onStop={audio.stop}
        onSwitchDevice={audio.switchDevice}
      />
    </div>
  );
}

interface LabeledSelectProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}

function LabeledSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: LabeledSelectProps<T>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          font: "500 12px/1 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          background: "var(--md-surface-container-high)",
          color: "var(--md-on-surface)",
          border: "1px solid var(--md-outline-variant)",
          font: "400 14px/1.2 Roboto, sans-serif",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          font: "500 11px/1 Roboto, sans-serif",
          color: "var(--md-on-surface-variant)",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </span>
      <span
        style={{
          font: "600 18px/1.2 Roboto, sans-serif",
          color: accent ? "var(--md-primary)" : "var(--md-on-surface)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
