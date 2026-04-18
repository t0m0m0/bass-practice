import type { PitchResult } from "../../types/audio";

interface PitchDisplayProps {
  pitch: PitchResult | null;
}

export function PitchDisplay({ pitch }: PitchDisplayProps) {
  const isActive = pitch?.detected === true;

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
      {/* Note name */}
      <div className="text-center">
        <span
          className={`text-6xl font-bold font-mono ${isActive ? "text-slate-100" : "text-slate-600"}`}
        >
          {isActive ? pitch.note : "---"}
        </span>
      </div>

      {/* Cents gauge */}
      <CentsGauge cents={isActive ? pitch.cents : 0} active={isActive} />

      {/* Frequency */}
      <div className="text-center text-sm text-slate-500 font-mono">
        {isActive ? `${pitch.frequency.toFixed(1)} Hz` : "—"}
      </div>
    </div>
  );
}

function CentsGauge({ cents, active }: { cents: number; active: boolean }) {
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const offset = (clampedCents / 50) * 50; // percentage offset from center

  const getColor = () => {
    const absCents = Math.abs(cents);
    if (absCents <= 10) return "bg-emerald-500";
    if (absCents <= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600 font-mono">
        <span>-50</span>
        <span>0</span>
        <span>+50</span>
      </div>
      <div className="relative w-full h-4 bg-slate-700 rounded-full overflow-hidden">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 w-px h-full bg-slate-500" />

        {/* Indicator */}
        {active && (
          <div
            className={`absolute top-0.5 h-3 w-3 rounded-full transition-all duration-75 ${getColor()}`}
            style={{
              left: `calc(50% + ${offset}% - 6px)`,
            }}
          />
        )}
      </div>
      <div className="text-center text-xs text-slate-500 font-mono">
        {active
          ? `${cents > 0 ? "+" : ""}${cents} cents`
          : "—"}
      </div>
    </div>
  );
}
