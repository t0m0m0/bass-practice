import { Link } from "react-router-dom";
import type { TabPreset } from "../../types/practice";

interface PresetCardProps {
  preset: TabPreset;
}

export function PresetCard({ preset }: PresetCardProps) {
  const beatsDisplay = `${preset.timeSignature.beatsPerMeasure}/${preset.timeSignature.beatUnit}`;

  return (
    <Link
      to={`/practice/tab/${preset.id}`}
      className="block p-5 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
          {preset.name}
        </h3>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
            {preset.bpm} BPM
          </span>
          <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
            {beatsDisplay}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-400">{preset.description}</p>
      <div className="mt-3 text-xs text-slate-500">
        {preset.measures} measures · {preset.notes.length} notes
      </div>
    </Link>
  );
}
