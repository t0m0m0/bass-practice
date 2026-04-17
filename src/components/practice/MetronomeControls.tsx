interface MetronomeControlsProps {
  bpm: number;
  isPlaying: boolean;
  phase: string;
  onBpmChange: (bpm: number) => void;
  onStart: () => void;
  onStop: () => void;
}

export function MetronomeControls({
  bpm,
  isPlaying,
  phase,
  onBpmChange,
  onStart,
  onStop,
}: MetronomeControlsProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">Metronome</h3>
        <div className="text-2xl font-bold tabular-nums text-white">
          {bpm} <span className="text-sm font-normal text-slate-400">BPM</span>
        </div>
      </div>

      <input
        type="range"
        min={20}
        max={300}
        value={bpm}
        onChange={(e) => onBpmChange(Number(e.target.value))}
        disabled={isPlaying}
        className="w-full accent-cyan-500"
      />

      <div className="flex gap-3">
        {phase === "idle" || phase === "finished" ? (
          <button
            onClick={onStart}
            className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors"
          >
            {phase === "finished" ? "Restart" : "Start"}
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {phase === "countdown" && (
        <div className="text-center text-lg text-yellow-400 animate-pulse">
          Get Ready...
        </div>
      )}
    </div>
  );
}
