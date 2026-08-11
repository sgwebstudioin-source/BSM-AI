import type { Greeks } from "../services/bsm";
import { motion } from "framer-motion";

interface Props {
  greeks: Greeks;
}

const META: {
  key: keyof Greeks;
  symbol: string;
  name: string;
  blurb: string;
  format: (n: number) => string;
}[] = [
  {
    key: "delta",
    symbol: "Δ",
    name: "Delta",
    blurb: "Δ price per 1₹ move in spot",
    format: (n) => n.toFixed(4),
  },
  {
    key: "gamma",
    symbol: "Γ",
    name: "Gamma",
    blurb: "Δ-of-Δ — convexity",
    format: (n) => n.toFixed(5),
  },
  {
    key: "theta",
    symbol: "Θ",
    name: "Theta",
    blurb: "₹ decay per calendar day",
    format: (n) => n.toFixed(3),
  },
  {
    key: "vega",
    symbol: "ν",
    name: "Vega",
    blurb: "₹ change per 1% IV move",
    format: (n) => n.toFixed(3),
  },
  {
    key: "rho",
    symbol: "ρ",
    name: "Rho",
    blurb: "₹ change per 1% rate move",
    format: (n) => n.toFixed(3),
  },
];

export function GreeksGrid({ greeks }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {META.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 * i }}
          className="glass relative overflow-hidden p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl text-accent-cyan">
              {m.symbol}
            </span>
            <span className="label">{m.name}</span>
          </div>
          <div className="mt-3 font-mono text-xl font-semibold text-slate-50">
            {m.format(greeks[m.key])}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">{m.blurb}</div>
        </motion.div>
      ))}
    </div>
  );
}
