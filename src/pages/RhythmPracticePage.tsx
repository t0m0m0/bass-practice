import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { rhythmPatterns } from "../data/rhythmPatterns";
import { rhythmPatternToTabPreset } from "../lib/practice/rhythmPattern";
import { useAudioInput } from "../hooks/useAudioInput";
import { useTabPractice } from "../hooks/useTabPractice";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { MetronomeControls } from "../components/practice/MetronomeControls";
import { TimingFeedback } from "../components/practice/TimingFeedback";
import { RhythmPatternDisplay } from "../components/practice/RhythmPatternDisplay";
import { Card, Tag } from "../components/md3";

export function RhythmPracticePage() {
  const [selectedId, setSelectedId] = useState(rhythmPatterns[0].id);
  const pattern =
    rhythmPatterns.find((p) => p.id === selectedId) ?? rhythmPatterns[0];
  const preset = useMemo(() => rhythmPatternToTabPreset(pattern), [pattern]);

  // Audio is owned by the outer component so switching patterns does NOT
  // tear down the AudioEngine / lose mic permission. Only the practice
  // session (metronome, timing events) is remounted via `key`.
  const audio = useAudioInput();

  return (
    <RhythmPracticeContent
      key={pattern.id}
      pattern={pattern}
      preset={preset}
      patterns={rhythmPatterns}
      onSelect={setSelectedId}
      selectedId={selectedId}
      audio={audio}
    />
  );
}

interface ContentProps {
  pattern: (typeof rhythmPatterns)[number];
  preset: ReturnType<typeof rhythmPatternToTabPreset>;
  patterns: typeof rhythmPatterns;
  selectedId: string;
  onSelect: (id: string) => void;
  audio: ReturnType<typeof useAudioInput>;
}

function RhythmPracticeContent({
  pattern,
  preset,
  patterns,
  selectedId,
  onSelect,
  audio,
}: ContentProps) {
  const practice = useTabPractice(preset, audio.engine);
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
  const micWarning = null;

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
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <Link to="/" style={{ color: "var(--md-primary)", textDecoration: "none", font: "400 13px/1 Roboto, sans-serif" }}>
          ← Home
        </Link>
        <h1 style={{ margin: 0, font: "500 22px/1.3 Roboto, sans-serif", color: "var(--md-on-surface)" }}>
          リズム練習
        </h1>
        <span style={{ font: "400 13px/1.4 Roboto, sans-serif", color: "var(--md-on-surface-variant)" }}>
          ピッチ不問、オンセットのタイミングのみを評価
        </span>
      </div>

      <Card style={{ padding: 16 }}>
        <div
          style={{
            font: "500 11px/1 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          パターン
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {patterns.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                style={{
                  border: "1px solid",
                  borderColor: active ? "var(--md-primary)" : "var(--md-outline-variant)",
                  background: active ? "var(--md-primary-container)" : "transparent",
                  color: active ? "var(--md-on-primary-container)" : "var(--md-on-surface)",
                  borderRadius: 20,
                  padding: "8px 14px",
                  font: "500 13px/1 Roboto, sans-serif",
                  cursor: "pointer",
                }}
              >
                {p.name}
              </button>
            );
          })}
        </div>
        <p
          style={{
            margin: "12px 0 0",
            font: "400 13px/1.5 Roboto, sans-serif",
            color: "var(--md-on-surface-variant)",
          }}
        >
          {pattern.description}
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <Tag label={`${pattern.timeSignature.beatsPerMeasure}/${pattern.timeSignature.beatUnit}`} />
          <Tag label={`${pattern.measures} 小節`} />
          <Tag label={pattern.subdivision === 4 ? "16分グリッド" : "8分グリッド"} />
        </div>
      </Card>

      <RhythmPatternDisplay
        pattern={pattern}
        currentBeat={practice.currentBeat}
        isPlaying={practice.phase === "playing"}
        timingEvents={practice.currentLoopEvents}
        loop={practice.loop}
      />

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
            {errorBlock}
          </div>
          <TimingFeedback
            lastEvent={practice.lastEvent}
            stats={practice.stats}
            phase={practice.phase}
            timingEvents={practice.timingEvents}
            loop={practice.loop}
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
          {errorBlock}
          <TimingFeedback
            lastEvent={practice.lastEvent}
            stats={practice.stats}
            phase={practice.phase}
            timingEvents={practice.timingEvents}
            loop={practice.loop}
          />
        </>
      )}
    </div>
  );
}
