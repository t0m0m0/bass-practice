interface SensitivitySliderProps {
  clarityThreshold: number;
  onThresholdChange: (value: number) => void;
}

export function SensitivitySlider({
  clarityThreshold,
  onThresholdChange,
}: SensitivitySliderProps) {
  const percentage = Math.round(clarityThreshold * 100);

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200">
          Detection Sensitivity
        </h2>
        <span className="text-sm text-slate-400 font-mono">
          {percentage}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 whitespace-nowrap">High</span>
        <input
          type="range"
          min="50"
          max="98"
          step="1"
          value={percentage}
          onChange={(e) => onThresholdChange(Number(e.target.value) / 100)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-emerald-500"
        />
        <span className="text-xs text-slate-500 whitespace-nowrap">Low</span>
      </div>
      <p className="text-xs text-slate-500">
        Lower values detect more notes but may include false positives. Default:
        85%
      </p>
    </div>
  );
}
