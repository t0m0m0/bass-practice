import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { tabPresets } from "../data/tabPresets";
import { useAudioInput } from "../hooks/useAudioInput";
import { useTabPractice } from "../hooks/useTabPractice";
import { AsciiTabDisplay } from "../components/practice/AsciiTabDisplay";
import { MetronomeControls } from "../components/practice/MetronomeControls";
import { TimingFeedback } from "../components/practice/TimingFeedback";
import { Tag } from "../components/md3";
import type { TabPreset } from "../types/practice";

export function TabPracticePage() {
  const { presetId } = useParams<{ presetId: string }>();
  const preset = tabPresets.find((p) => p.id === presetId);

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
  const practice = useTabPractice(preset, audio.engine);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = async () => {
    setStartError(null);
    if (!audio.isListening) {
      audio.start().catch(() => {});
    }
    try {
      await practice.startSession();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
    }
  };

  const displayedError = startError;
  const micWarning = !startError && audio.error ? audio.error : null;

  return (
    <div
      style={{
        padding: "24px 16px",
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

      <AsciiTabDisplay
        preset={preset}
        currentBeat={practice.currentBeat}
        isPlaying={practice.phase === "playing"}
      />

      <MetronomeControls
        bpm={practice.metronome.bpm}
        isPlaying={practice.metronome.isPlaying}
        phase={practice.phase}
        onBpmChange={practice.metronome.setBpm}
        onStart={handleStart}
        onStop={practice.stopSession}
      />

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

      {micWarning && (
        <div
          style={{
            background: "#f9a8251a",
            border: "1px solid #f9a82566",
            color: "#f9a825",
            borderRadius: 12,
            padding: "12px 16px",
            font: "400 13px/1.5 Roboto, sans-serif",
          }}
        >
          🎤 マイクが利用できません（メトロノームは動作します）: {micWarning}
        </div>
      )}

      <TimingFeedback
        lastEvent={practice.lastEvent}
        stats={practice.stats}
        phase={practice.phase}
        timingEvents={practice.timingEvents}
        loop={practice.loop}
      />
    </div>
  );
}
