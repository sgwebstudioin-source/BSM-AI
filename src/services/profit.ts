/**
 * Per-lot profit projection at expiry.
 *
 * Given a BSM-priced option, build a small ladder of "what if spot ends here"
 * P&L scenarios (flat, break-even, ±1σ, ±2σ) so users can see concrete ₹
 * outcomes per lot, not just abstract Greeks.
 */

import type { BSMResult } from "./bsm";

export interface ProfitScenario {
  label: string;
  spot: number;
  spotDeltaPct: number;
  pnlPerShare: number;
  pnlPerLot: number;
  isProfit: boolean;
}

export interface ProfitProjection {
  premiumPerShare: number;
  costPerLot: number;
  lotSize: number;
  maxLossPerLot: number;
  breakEven: number;
  scenarios: ProfitScenario[];
  /** Convenience: 1σ-favorable scenario, the canonical "if it works" target. */
  target: ProfitScenario;
}

export function projectProfit(
  result: BSMResult,
  lotSize: number
): ProfitProjection {
  const { inputs, price, breakEven } = result;
  const sigma = inputs.volatility;
  const T = Math.max(inputs.daysToExpiry, 0.5) / 365;
  const stdDev = inputs.spot * sigma * Math.sqrt(T);
  const dir = inputs.type === "call" ? 1 : -1;

  const points: { label: string; spot: number }[] = [
    { label: "Flat (spot unchanged)", spot: inputs.spot },
    { label: "Break-even", spot: breakEven },
    { label: "1σ target", spot: inputs.spot + dir * stdDev },
    { label: "2σ target", spot: inputs.spot + dir * 2 * stdDev },
  ];

  const scenarios: ProfitScenario[] = points.map((p) => {
    const intrinsic =
      inputs.type === "call"
        ? Math.max(p.spot - inputs.strike, 0)
        : Math.max(inputs.strike - p.spot, 0);
    const pnlPerShare = intrinsic - price;
    return {
      label: p.label,
      spot: p.spot,
      spotDeltaPct: ((p.spot - inputs.spot) / inputs.spot) * 100,
      pnlPerShare,
      pnlPerLot: pnlPerShare * lotSize,
      isProfit: pnlPerShare > 0.0001,
    };
  });

  return {
    premiumPerShare: price,
    costPerLot: price * lotSize,
    lotSize,
    maxLossPerLot: -price * lotSize,
    breakEven,
    scenarios,
    target: scenarios[2], // 1σ
  };
}
