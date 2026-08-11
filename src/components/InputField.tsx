import type { ReactNode } from "react";

interface Props {
  label: string;
  hint?: ReactNode;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  withSlider?: boolean;
}

export function InputField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  withSlider,
}: Props) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          className="input"
          value={Number.isFinite(value) ? value : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) ? v : 0);
          }}
        />
        {suffix && (
          <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {withSlider && min !== undefined && max !== undefined && (
        <input
          type="range"
          className="mt-3 w-full"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
      )}
    </label>
  );
}
