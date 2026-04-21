import type { PitchResult } from "../../types/audio";
import { Card } from "../md3";

interface PitchDisplayProps {
  pitch: PitchResult | null;
  gaugeSize?: number;
}

export function PitchDisplay({ pitch, gaugeSize = 240 }: PitchDisplayProps) {
  const isActive = pitch?.detected === true;
  const cents = isActive ? pitch.cents : 0;
  const abs = Math.abs(cents);
  const color =
    !isActive
      ? "var(--md-on-surface-variant)"
      : abs <= 10
        ? "var(--md-primary)"
        : abs <= 25
          ? "#f9a825"
          : "#ef5350";

  return (
    <Card
      style={{
        padding: "32px 24px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            font: "300 80px/1 Roboto, sans-serif",
            color,
            letterSpacing: -2,
            transition: "color 0.2s",
          }}
        >
          {isActive ? pitch.note : "---"}
        </div>
        <div
          style={{
            font: "400 14px/1 Roboto Mono, monospace",
            color: "var(--md-on-surface-variant)",
            marginTop: 8,
          }}
        >
          {isActive ? `${pitch.frequency.toFixed(1)} Hz` : "—"}
        </div>
      </div>

      <CentsGauge cents={cents} active={isActive} size={gaugeSize} />
    </Card>
  );
}

function CentsGauge({ cents, active, size = 240 }: { cents: number; active: boolean; size?: number }) {
  const clamped = Math.max(-50, Math.min(50, cents));
  const abs = Math.abs(cents);
  const colorHex =
    abs <= 10 ? "#4ecdc4" : abs <= 25 ? "#f9a825" : "#ef5350";
  const colorClass =
    abs <= 10 ? "bg-emerald-500" : abs <= 25 ? "bg-yellow-500" : "bg-red-500";
  const label = abs <= 5 ? "IN TUNE" : clamped < 0 ? "FLAT" : "SHARP";

  // Scale everything relative to base size of 240
  const scale = size / 240;
  const svgW = size;
  const svgH = Math.round(130 * scale);
  const cx = size / 2;
  const cy = svgH - Math.round(10 * scale);
  const radius = Math.round(100 * scale);
  const sw = Math.round(12 * scale);
  const pad = Math.round(20 * scale);
  const needleH = Math.round(100 * scale);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
      }}
    >
      {/* Arc gauge */}
      <div
        style={{
          position: "relative",
          width: svgW,
          height: svgH,
          overflow: "hidden",
        }}
      >
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <path
            d={`M ${pad} ${cy} A ${radius} ${radius} 0 0 1 ${svgW - pad} ${cy}`}
            fill="none"
            stroke="var(--md-surface-container-highest)"
            strokeWidth={sw}
            strokeLinecap="round"
          />
          {active && (
            <path
              d={`M ${pad} ${cy} A ${radius} ${radius} 0 0 1 ${svgW - pad} ${cy}`}
              fill="none"
              stroke={colorHex + "44"}
              strokeWidth={sw}
              strokeLinecap="round"
            />
          )}
          <line
            x1={cx}
            y1={cy - radius - Math.round(6 * scale)}
            x2={cx}
            y2={cy - radius + Math.round(14 * scale)}
            stroke="var(--md-outline)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {[-50, -25, 0, 25, 50].map((t) => {
            const angle = (t / 50) * 75;
            const rad2 = ((90 + angle) * Math.PI) / 180;
            const r1 = radius - Math.round(6 * scale);
            const r2 = radius + Math.round(4 * scale);
            const x1 = cx + r1 * Math.cos(Math.PI - rad2);
            const y1 = cy - r1 * Math.sin(Math.PI - rad2);
            const x2 = cx + r2 * Math.cos(Math.PI - rad2);
            const y2 = cy - r2 * Math.sin(Math.PI - rad2);
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--md-outline)"
                strokeWidth={t === 0 ? 2 : 1}
              />
            );
          })}
        </svg>
        {active && (
          <div
            className={colorClass}
            style={{
              position: "absolute",
              bottom: 0,
              left: "50%",
              width: 2,
              height: needleH,
              transformOrigin: "bottom center",
              transform: `translateX(-50%) rotate(${(clamped / 50) * 75}deg)`,
              background: colorHex,
              borderRadius: 1,
              transition: "transform 0.15s ease-out",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 12,
            height: 12,
            borderRadius: 6,
            background: active ? colorHex : "var(--md-outline)",
            transition: "background 0.15s",
          }}
        />
      </div>

      <div
        style={{
          font: "500 13px/1 Roboto, sans-serif",
          letterSpacing: 1.5,
          color: active ? colorHex : "var(--md-on-surface-variant)",
          textTransform: "uppercase",
          transition: "color 0.15s",
        }}
      >
        {active ? label : "—"}
      </div>

      <div
        style={{
          font: "400 13px/1 Roboto Mono, monospace",
          color: "var(--md-on-surface-variant)",
        }}
      >
        {active ? `${cents > 0 ? "+" : ""}${cents} cents` : "—"}
      </div>
    </div>
  );
}
