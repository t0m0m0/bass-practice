import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  variant?: "filled" | "outlined";
}

export function Card({ children, style, variant = "filled" }: CardProps) {
  const base: CSSProperties = {
    borderRadius: 12,
    overflow: "hidden",
    background:
      variant === "outlined"
        ? "var(--md-surface)"
        : "var(--md-surface-container-high)",
    border:
      variant === "outlined" ? "1px solid var(--md-outline-variant)" : "none",
    ...style,
  };
  return <div style={base}>{children}</div>;
}

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
  type?: "button" | "submit";
  ariaLabel?: string;
}

export function FilledButton({
  label,
  onClick,
  disabled,
  icon,
  style,
  type = "button",
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        background: disabled
          ? "var(--md-on-surface-variant)"
          : "var(--md-primary)",
        color: disabled ? "var(--md-surface)" : "var(--md-on-primary)",
        border: "none",
        borderRadius: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "10px 24px",
        font: "500 14px/1 Roboto, sans-serif",
        letterSpacing: 0.1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        transition: "background 0.15s, box-shadow 0.15s",
        ...style,
      }}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {label}
    </button>
  );
}

export function OutlinedButton({
  label,
  onClick,
  disabled,
  icon,
  style,
  type = "button",
  ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        background: "transparent",
        color: disabled ? "var(--md-on-surface-variant)" : "var(--md-primary)",
        border: `1px solid ${disabled ? "var(--md-outline-variant)" : "var(--md-outline)"}`,
        borderRadius: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "10px 24px",
        font: "500 14px/1 Roboto, sans-serif",
        letterSpacing: 0.1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        transition: "background 0.15s",
        ...style,
      }}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {label}
    </button>
  );
}

interface TagProps {
  label: string;
  style?: CSSProperties;
}

export function Tag({ label, style }: TagProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 10px",
        borderRadius: 6,
        background: "var(--md-surface-container-highest)",
        color: "var(--md-on-surface-variant)",
        font: "500 11px/1 Roboto, sans-serif",
        letterSpacing: 0.5,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

interface AssistChipProps {
  label: string;
}

export function AssistChip({ label }: AssistChipProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 28,
        padding: "0 12px",
        borderRadius: 14,
        background: "var(--md-surface-container-highest)",
        color: "var(--md-on-surface)",
        border: "1px solid var(--md-outline-variant)",
        font: "500 12px/1 Roboto, sans-serif",
        letterSpacing: 0.2,
      }}
    >
      {label}
    </span>
  );
}

interface Md3SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function Md3Slider({
  min,
  max,
  step = 1,
  value,
  onChange,
  disabled,
  ariaLabel,
}: Md3SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 32,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Track */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 4,
          borderRadius: 2,
          background: "var(--md-surface-container-highest)",
          transform: "translateY(-50%)",
        }}
      />
      {/* Active track */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          height: 4,
          width: `${pct}%`,
          borderRadius: 2,
          background: disabled
            ? "var(--md-on-surface-variant)"
            : "var(--md-primary)",
          transform: "translateY(-50%)",
          transition: "width 0.1s",
        }}
      />
      {/* Thumb */}
      <div
        style={{
          position: "absolute",
          left: `calc(${pct}% - 10px)`,
          top: "50%",
          width: 20,
          height: 20,
          borderRadius: 10,
          background: disabled
            ? "var(--md-on-surface-variant)"
            : "var(--md-primary)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          transition: "left 0.1s",
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          margin: 0,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      />
    </div>
  );
}

interface SectionLabelProps {
  children: ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div
      style={{
        font: "500 11px/1 Roboto, sans-serif",
        letterSpacing: 1.5,
        color: "var(--md-on-surface-variant)",
        textTransform: "uppercase",
        padding: "0 4px",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
