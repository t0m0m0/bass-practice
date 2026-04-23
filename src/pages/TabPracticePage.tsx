import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { tabPresets } from "../data/tabPresets";
import { useCustomTabs } from "../hooks/useCustomTabs";
import { useAudioInput } from "../hooks/useAudioInput";
import { useTabPractice } from "../hooks/useTabPractice";
import { AsciiTabDisplay } from "../components/practice/AsciiTabDisplay";
import { MetronomeControls } from "../components/practice/MetronomeControls";
import { AutoBpmControls } from "../components/practice/AutoBpmControls";
import { TimingFeedback } from "../components/practice/TimingFeedback";
import { ComboDisplay } from "../components/practice/ComboDisplay";
import { CountdownOverlay } from "../components/practice/CountdownOverlay";
import { Tag } from "../components/md3";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { TabPreset } from "../types/practice";

export function TabPracticePage() {
  const { presetId } = useParams<{ presetId: string }>();
  const { tabs: customTabs } = useCustomTabs();
  const preset =
    tabPresets.find((p) => p.id === presetId) ??
    customTabs.find((p) => p.id === presetId);

  if (!preset) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 16px",
          color: "var(--md-on-surface-variant)",
        }}
      >
        <h2
          style={{
            font: "400 20px/1.2 Roboto, sans-serif",
            marginBottom: 16,
          }}
        >
          Preset not found
        </h2>
        <Link
          to="/"
          style={{ color: "var(--md-primary)", textDecoration: "none" }}
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  return <TabPracticeContent preset={preset} />;
}

interface TabPracticeContentProps {
  preset: TabPreset;
}

function TabPracticeContent({ preset }: TabPracticeContentProps) {
  const audio = useAudioInput();
  const [pitchJudgeEnabled, setPitchJudgeEnabled] = useState(true);
  const [toleranceCents, setToleranceCents] = useState(50);
  const pitchJudge = useMemo(
    () => ({ enabled: pitchJudgeEnabled, toleranceCents }),
    [pitchJudgeEnabled, toleranceCents],
  );
  const practice = useTabPractice(preset, audio.engine, pitchJudge);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStartPending, setIsStartPending] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleStart = async () => {
    setStartError(null);
    setIsStartPending(true);

    try {
      if (!audio.isListening) {
        await audio.start();
      }
      await practice.startSession();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStartPending(false);
    }
  };

  const displayedError = startError ?? audio.error;

  const autoBpmBlock = (
    <AutoBpmControls
      config={practice.autoBpm.config}
      currentBpm={practice.metronome.bpm}
      startBpm={practice.autoBpm.startBpm}
      levelUps={practice.autoBpm.levelUps}
      notification={practice.autoBpm.notification}
      phase={practice.phase}
      onEnabledChange={practice.autoBpm.setEnabled}
      onThresholdChange={practice.autoBpm.setHitRateThreshold}
      onIncrementChange={practice.autoBpm.setBpmIncrement}
      onMaxBpmChange={practice.autoBpm.setMaxBpm}
    />
  );

  const errorBlock = (
    <>
      {displayedError && (
        <div
          role="alert"
          style={{
            background: "#ef53501a",
            border: "1px solid #ef535066",
            color: "#ef5350",
            borderRadius: 12,
            padding: "12px 16px",
            font: "400 13px/1.5 Roboto, sans-serif",
          }}
        >
          {displayedError}
        </div>
      )}

    </>
  );

  return (
    <div
      style={{
        padding: isDesktop ? "32px 32px" : "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <p
          style={{
            margin: 0,
            font: "400 14px/1.5 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
            flex: 1,
          }}
        >
          {preset.description}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag
            label={`${preset.timeSignature.beatsPerMeasure}/${preset.timeSignature.beatUnit}`}
          />
          <Tag label={`${preset.measures} 小節`} />
        </div>
      </div>

      <div style={{ position: "relative" }}>
        <AsciiTabDisplay
          preset={preset}
          currentBeat={practice.currentBeat}
          isPlaying={practice.phase === "playing"}
          beatWidth={isDesktop ? 64 : 48}
          lastEvent={practice.lastEvent}
          eventSeq={practice.eventSeq}
        />
        {practice.phase === "playing" && (
          <ComboDisplay combo={practice.combo} seq={practice.eventSeq} />
        )}
      </div>

      {isDesktop ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <MetronomeControls
              bpm={practice.metronome.bpm}
              isPlaying={practice.metronome.isPlaying}
              phase={practice.phase}
              isStartPending={isStartPending || audio.isStarting}
              onBpmChange={practice.metronome.setBpm}
              onStart={handleStart}
              onStop={practice.stopSession}
            />
            {autoBpmBlock}
            <PitchJudgeToggle
              enabled={pitchJudgeEnabled}
              toleranceCents={toleranceCents}
              onEnabledChange={setPitchJudgeEnabled}
              onToleranceChange={setToleranceCents}
            />
            {errorBlock}
          </div>
          <TimingFeedback
            lastEvent={practice.lastEvent}
            eventSeq={practice.eventSeq}
            stats={practice.stats}
            phase={practice.phase}
            timingEvents={practice.timingEvents}
            loop={practice.loop}
            maxCombo={practice.maxCombo}
          />
        </div>
      ) : (
        <>
          <MetronomeControls
            bpm={practice.metronome.bpm}
            isPlaying={practice.metronome.isPlaying}
            phase={practice.phase}
            isStartPending={isStartPending || audio.isStarting}
            onBpmChange={practice.metronome.setBpm}
            onStart={handleStart}
            onStop={practice.stopSession}
          />
          {autoBpmBlock}
          <PitchJudgeToggle
            enabled={pitchJudgeEnabled}
            toleranceCents={toleranceCents}
            onEnabledChange={setPitchJudgeEnabled}
            onToleranceChange={setToleranceCents}
          />
          {errorBlock}
          <TimingFeedback
            lastEvent={practice.lastEvent}
            eventSeq={practice.eventSeq}
            stats={practice.stats}
            phase={practice.phase}
            timingEvents={practice.timingEvents}
            loop={practice.loop}
            maxCombo={practice.maxCombo}
          />
        </>
      )}
      <CountdownOverlay count={practice.countdown} />
    </div>
  );
}

interface PitchJudgeToggleProps {
  enabled: boolean;
  toleranceCents: number;
  onEnabledChange: (v: boolean) => void;
  onToleranceChange: (v: number) => void;
}

function PitchJudgeToggle({
  enabled,
  toleranceCents,
  onEnabledChange,
  onToleranceChange,
}: PitchJudgeToggleProps) {
  return (
    <div
      style={{
        background: "var(--md-surface-container)",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          font: "500 14px/1.4 Roboto, sans-serif",
          color: "var(--md-on-surface)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        音程の正確さを判定
      </label>
      {enabled && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            font: "400 13px/1.4 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
          }}
        >
          <span style={{ minWidth: 80 }}>許容幅</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={toleranceCents}
            onChange={(e) => onToleranceChange(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: 48, textAlign: "right" }}>
            ±{toleranceCents}¢
          </span>
        </label>
      )}
    </div>
  );
}
