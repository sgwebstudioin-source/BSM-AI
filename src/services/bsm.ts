/**
 * Black-Scholes-Merton pricing engine.
 * Pure-math module: no React, no I/O. All inputs in decimal form
 * (e.g. r = 0.07 for 7%, sigma = 0.22 for 22%).
 */

export type OptionType = "call" | "put";

export interface BSMInputs {
  spot: number;        // S — current underlying price
  strike: number;      // K
  daysToExpiry: number;
  volatility: number;  // σ as decimal (0.22 = 22%)
  riskFreeRate: number; // r as decimal (0.07 = 7%)
  dividendYield?: number; // q, default 0
  type: OptionType;
}

export interface BSMResult {
  price: number;
  intrinsic: number;
  extrinsic: number;
  breakEven: number;
  breakEvenPct: number;   // % move from spot to break-even
  greeks: Greeks;
  d1: number;
  d2: number;
  inputs: BSMInputs;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number; // per day
  vega: number;  // per 1% change in vol
  rho: number;   // per 1% change in rate
}

/**
 * Cumulative standard normal distribution.
 * Abramowitz & Stegun 26.2.17 — max error ~7.5e-8.
 */
export function cnd(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * ax);
  const y =
    1 -
    (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return 0.5 * (1 + sign * y);
}

function pdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

const YEAR_DAYS = 365;

export function priceBSM(inputs: BSMInputs): BSMResult {
  const {
    spot: S,
    strike: K,
    daysToExpiry,
    volatility: sigma,
    riskFreeRate: r,
    dividendYield: q = 0,
    type,
  } = inputs;

  const T = Math.max(daysToExpiry, 0) / YEAR_DAYS;

  // Edge case: at/after expiry — value collapses to intrinsic.
  if (T <= 0 || sigma <= 0) {
    const intrinsic =
      type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
    const breakEven = type === "call" ? K + intrinsic : K - intrinsic;
    return {
      price: intrinsic,
      intrinsic,
      extrinsic: 0,
      breakEven,
      breakEvenPct: ((breakEven - S) / S) * 100,
      greeks: {
        delta: type === "call" ? (S > K ? 1 : 0) : S < K ? -1 : 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
      },
      d1: 0,
      d2: 0,
      inputs,
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = cnd(d1);
  const Nd2 = cnd(d2);
  const Nmd1 = cnd(-d1);
  const Nmd2 = cnd(-d2);
  const pd1 = pdf(d1);

  const discR = Math.exp(-r * T);
  const discQ = Math.exp(-q * T);

  let price: number;
  let delta: number;
  let theta: number;
  let rho: number;

  if (type === "call") {
    price = S * discQ * Nd1 - K * discR * Nd2;
    delta = discQ * Nd1;
    theta =
      (-S * discQ * pd1 * sigma) / (2 * sqrtT) -
      r * K * discR * Nd2 +
      q * S * discQ * Nd1;
    rho = K * T * discR * Nd2;
  } else {
    price = K * discR * Nmd2 - S * discQ * Nmd1;
    delta = -discQ * Nmd1;
    theta =
      (-S * discQ * pd1 * sigma) / (2 * sqrtT) +
      r * K * discR * Nmd2 -
      q * S * discQ * Nmd1;
    rho = -K * T * discR * Nmd2;
  }

  const gamma = (discQ * pd1) / (S * sigma * sqrtT);
  const vega = S * discQ * pd1 * sqrtT;

  const intrinsic = type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
  const extrinsic = Math.max(price - intrinsic, 0);
  const breakEven = type === "call" ? K + price : K - price;
  const breakEvenPct = ((breakEven - S) / S) * 100;

  return {
    price,
    intrinsic,
    extrinsic,
    breakEven,
    breakEvenPct,
    greeks: {
      delta,
      gamma,
      // Convention: theta as per-calendar-day P&L impact
      theta: theta / YEAR_DAYS,
      // Vega per 1% vol point
      vega: vega / 100,
      // Rho per 1% rate change
      rho: rho / 100,
    },
    d1,
    d2,
    inputs,
  };
}

/**
 * Build a payoff curve at expiry across a range of underlying prices.
 * Useful for the dashboard's payoff visualization.
 */
export function payoffCurve(
  inputs: BSMInputs,
  premium: number,
  steps = 60
): { price: number; pnl: number }[] {
  const span = inputs.spot * 0.25;
  const min = Math.max(inputs.spot - span, 0.01);
  const max = inputs.spot + span;
  const out: { price: number; pnl: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const S = min + ((max - min) * i) / steps;
    const intrinsic =
      inputs.type === "call"
        ? Math.max(S - inputs.strike, 0)
        : Math.max(inputs.strike - S, 0);
    out.push({ price: S, pnl: intrinsic - premium });
  }
  return out;
}
