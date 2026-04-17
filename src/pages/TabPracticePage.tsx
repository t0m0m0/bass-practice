import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { tabPresets } from "../data/tabPresets";
import { useAudioInput } from "../hooks/useAudioInput";
import { useTabPractice } from "../hooks/useTabPractice";
import { AsciiTabDisplay } from "../components/practice/AsciiTabDisplay";
import { MetronomeControls } from "../components/practice/MetronomeControls";
import { TimingFeedback } from "../components/practice/TimingFeedback";
import type { TabPreset } from "../types/practice";

export function TabPracticePage() {
  const { presetId } = useParams<{ presetId: string }>();
  const preset = tabPresets.find((p) => p.id === presetId);

  if (!preset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-slate-400 mb-4">Preset not found</h2>
        <Link to="/" className="text-cyan-400 hover:text-cyan-300">
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
    try {
      if (!audio.isListening) {
        await audio.start();
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      await practice.startSession();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
    }
  };

  const displayedError = startError ?? audio.error;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="text-sm text-slate-400 hover:text-slate-300 mb-1 inline-block"
          >
            ← Back
          </Link>
          <h2 className="text-xl font-semibold text-white">{preset.name}</h2>
          <p className="text-sm text-slate-400">{preset.description}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">
            {preset.timeSignature.beatsPerMeasure}/{preset.timeSignature.beatUnit} ·{" "}
            {preset.measures} measures
          </div>
        </div>
      </div>

      {/* Tab Display */}
      <AsciiTabDisplay
        preset={preset}
        currentBeat={practice.currentBeat}
        isPlaying={practice.phase === "playing"}
      />

      {/* Controls */}
      <MetronomeControls
        bpm={practice.metronome.bpm}
        isPlaying={practice.metronome.isPlaying}
        isAudioReady={audio.isListening || audio.isPermissionGranted}
        phase={practice.phase}
        onBpmChange={practice.metronome.setBpm}
        onStart={handleStart}
        onStop={practice.stopSession}
      />

      {displayedError && (
        <div
          role="alert"
          className="bg-red-950/40 border border-red-800 text-red-200 text-sm rounded px-4 py-3"
        >
          {displayedError}
        </div>
      )}

      {/* Feedback */}
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
