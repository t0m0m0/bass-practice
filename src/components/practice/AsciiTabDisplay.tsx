import { useMemo } from "react";
import type { TabPreset, TabNote } from "../../types/practice";

interface AsciiTabDisplayProps {
  preset: TabPreset;
  currentBeat: number;
  isPlaying: boolean;
}

const STRING_LABELS = ["G", "D", "A", "E"];

export function AsciiTabDisplay({ preset, currentBeat, isPlaying }: AsciiTabDisplayProps) {
  const totalBeats = preset.timeSignature.beatsPerMeasure * preset.measures;

  // Build a map: string -> beat -> fret number (memoized to avoid rebuild on every render)
  const noteMap = useMemo(() => {
    const map = new Map<number, Map<number, TabNote>>();
    for (const note of preset.notes) {
      if (!map.has(note.string)) {
        map.set(note.string, new Map());
      }
      map.get(note.string)!.set(note.beat, note);
    }
    return map;
  }, [preset.notes]);

  return (
    <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
      {[1, 2, 3, 4].map((stringNum) => {
        const stringNotes = noteMap.get(stringNum) ?? new Map();
        return (
          <div key={stringNum} className="flex items-center">
            <span className="w-6 text-slate-500 text-right mr-2">
              {STRING_LABELS[stringNum - 1]}
            </span>
            <span className="text-slate-600">|</span>
            {Array.from({ length: totalBeats }, (_, beat) => {
              const note = stringNotes.get(beat);
              const isCurrent = isPlaying && beat === currentBeat;
              const hasMeasureLine =
                beat > 0 && beat % preset.timeSignature.beatsPerMeasure === 0;

              return (
                <span key={beat} className="inline-flex">
                  {hasMeasureLine && (
                    <span className="text-slate-600">|</span>
                  )}
                  <span
                    className={`w-8 text-center ${
                      isCurrent
                        ? "bg-cyan-900/50 text-cyan-300 font-bold rounded"
                        : note
                          ? "text-slate-200"
                          : "text-slate-600"
                    }`}
                  >
                    {note ? String(note.fret) : "—"}
                  </span>
                </span>
              );
            })}
            <span className="text-slate-600">|</span>
          </div>
        );
      })}

      {/* Beat numbers row */}
      <div className="flex items-center mt-1">
        <span className="w-6 mr-2" />
        <span className="w-px" />
        {Array.from({ length: totalBeats }, (_, beat) => {
          const isCurrent = isPlaying && beat === currentBeat;
          const hasMeasureLine =
            beat > 0 && beat % preset.timeSignature.beatsPerMeasure === 0;
          const beatInMeasure = (beat % preset.timeSignature.beatsPerMeasure) + 1;

          return (
            <span key={beat} className="inline-flex">
              {hasMeasureLine && <span className="w-px" />}
              <span
                className={`w-8 text-center text-xs ${
                  isCurrent ? "text-cyan-400 font-bold" : "text-slate-600"
                }`}
              >
                {beatInMeasure}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
