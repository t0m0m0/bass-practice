interface AudioMeterProps {
  level: number;
}

export function AudioMeter({ level }: AudioMeterProps) {
  const db = 20 * Math.log10(Math.max(level, 1e-6));
  const normalizedLevel = Math.max(0, Math.min(1, (db + 60) / 60));
  const percentage = normalizedLevel * 100;

  const getColor = () => {
    if (normalizedLevel > 0.8) return "bg-red-500";
    if (normalizedLevel > 0.5) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-400">Input Level</span>
        <span className="text-xs text-slate-500 font-mono">
          {(normalizedLevel * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-75 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
