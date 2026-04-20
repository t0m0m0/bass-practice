interface AudioMeterProps {
  level: number;
}

export function AudioMeter({ level }: AudioMeterProps) {
  const db = 20 * Math.log10(Math.max(level, 1e-6));
  const normalizedLevel = Math.max(0, Math.min(1, (db + 60) / 60));
  const percentage = normalizedLevel * 100;

  const colorClass =
    normalizedLevel > 0.8
      ? "bg-red-500"
      : normalizedLevel > 0.5
        ? "bg-yellow-500"
        : "bg-emerald-500";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[var(--md-on-surface-variant)]">
          Input Level
        </span>
        <span className="text-[11px] font-mono text-[var(--md-on-surface-variant)]">
          {(normalizedLevel * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--md-surface-container-highest)]">
        <div
          className={`h-full rounded-full transition-all duration-75 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
