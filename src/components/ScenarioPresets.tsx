import type { OptionType } from "../services/bsm";
import { Flame, Shield, TrendingDown, TrendingUp, Wind } from "lucide-react";

export interface Scenario {
  id: string;
  label: string;
  description: string;
  type: OptionType;
  /** Strike offset relative to spot, expressed as a % (e.g. 0 = ATM, 2 = 2% OTM call). */
  strikeOffsetPct: number;
  daysToExpiry: number;
  volBias?: number; // additive vol bias, % points
  icon: React.ReactNode;
  accent: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "bull-atm",
    label: "Bullish ATM Call",
    description: "Buy near-spot call, 30 DTE — clean directional thesis.",
    type: "call",
    strikeOffsetPct: 0,
    daysToExpiry: 30,
    icon: <TrendingUp size={14} />,
    accent: "text-accent-lime",
  },
  {
    id: "bear-hedge",
    label: "Bearish Hedge",
    description: "Slightly OTM put, 21 DTE — portfolio protection.",
    type: "put",
    strikeOffsetPct: -2,
    daysToExpiry: 21,
    icon: <Shield size={14} />,
    accent: "text-accent-rose",
  },
  {
    id: "vol-crush",
    label: "Volatility Crush",
    description: "Short-dated ATM call before earnings — short vol bias.",
    type: "call",
    strikeOffsetPct: 0,
    daysToExpiry: 7,
    volBias: 6,
    icon: <Wind size={14} />,
    accent: "text-accent-cyan",
  },
  {
    id: "lottery",
    label: "OTM Lottery",
    description: "Cheap deep-OTM call, 14 DTE — convexity bet.",
    type: "call",
    strikeOffsetPct: 5,
    daysToExpiry: 14,
    icon: <Flame size={14} />,
    accent: "text-accent-amber",
  },
  {
    id: "bear-sweep",
    label: "Bearish Momentum Put",
    description: "Mildly ITM put, 30 DTE — directional with cushion.",
    type: "put",
    strikeOffsetPct: 2,
    daysToExpiry: 30,
    icon: <TrendingDown size={14} />,
    accent: "text-accent-violet",
  },
];

interface Props {
  onApply: (s: Scenario) => void;
}

export function ScenarioPresets({ onApply }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => onApply(s)}
          className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
        >
          <span
            className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.04] ${s.accent}`}
          >
            {s.icon}
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-100">{s.label}</div>
            <div className="text-xs text-slate-500">{s.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
