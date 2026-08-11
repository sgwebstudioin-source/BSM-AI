/**
 * "Today's Trade Ideas" generator.
 *
 * Produces 5 deterministic-per-day option setups by combining a small library
 * of strategy templates with a rotating ticker pool. Each idea is fully
 * priced (BSM) and carries a profit projection so users can compare ideas
 * side-by-side and one-click apply them to the dashboard.
 *
 * Determinism: seeded by day-of-year so the list refreshes daily but stays
 * stable across page reloads on the same day.
 */

import { TICKERS, type TickerMeta, findTicker } from "../data/tickers";
import { priceBSM, type OptionType } from "./bsm";

interface IdeaTemplate {
  id: string;
  title: string;
  thesis: string;
  type: OptionType;
  strikeOffsetPct: number; // % from spot — positive = above spot
  daysToExpiry: number;
  volBias?: number; // additive vol adjustment, percentage points
  tag: "Bullish" | "Bearish" | "Vol" | "Speculative" | "Income";
  /** Tickers this template prefers — rotated by day. */
  pool: string[];
}

const TEMPLATES: IdeaTemplate[] = [
  {
    id: "bull-atm",
    title: "Bullish ATM Call",
    thesis:
      "Directional bet — buy the at-the-money call expecting a clean monthly drift higher.",
    type: "call",
    strikeOffsetPct: 0,
    daysToExpiry: 30,
    tag: "Bullish",
    pool: ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "ICICIBANK"],
  },
  {
    id: "bear-hedge",
    title: "Bearish Protective Put",
    thesis:
      "Slightly OTM put as a 3-week hedge — limited cost insurance against a pullback.",
    type: "put",
    strikeOffsetPct: -2,
    daysToExpiry: 21,
    tag: "Bearish",
    pool: ["RELIANCE", "HDFCBANK", "INFY", "ICICIBANK", "TCS"],
  },
  {
    id: "vol-crush",
    title: "Weekly Volatility Play",
    thesis:
      "Short-dated ATM call into elevated IV — extreme theta, big vega exposure.",
    type: "call",
    strikeOffsetPct: 0,
    daysToExpiry: 7,
    volBias: 4,
    tag: "Vol",
    pool: ["BANKNIFTY", "NIFTY", "FINNIFTY"],
  },
  {
    id: "lottery",
    title: "OTM Lottery Ticket",
    thesis:
      "Cheap, deep-OTM call on a high-vol name — low probability, asymmetric payoff.",
    type: "call",
    strikeOffsetPct: 5,
    daysToExpiry: 14,
    tag: "Speculative",
    pool: ["TATAMOTORS", "ADANIENT", "INFY"],
  },
  {
    id: "stock-rep",
    title: "Stock Replacement (Deep ITM)",
    thesis:
      "Deep ITM call as a leveraged stock substitute — high delta, low time decay, less capital.",
    type: "call",
    strikeOffsetPct: -7,
    daysToExpiry: 60,
    tag: "Income",
    pool: ["TCS", "HDFCBANK", "INFY", "RELIANCE"],
  },
];

export interface DailyIdea {
  id: string;
  title: string;
  thesis: string;
  ticker: TickerMeta;
  type: OptionType;
  spot: number;
  strike: number;
  strikeOffsetPct: number;
  daysToExpiry: number;
  volatility: number; // %
  riskFreeRate: number; // %
  premium: number;
  lotSize: number;
  costPerLot: number;
  targetSpot: number;
  targetMovePct: number;
  projectedProfitPerLot: number;
  projectedRoiPct: number;
  maxLossPerLot: number;
  breakEven: number;
  breakEvenPct: number;
  tag: IdeaTemplate["tag"];
  /** True if `spot` came from a live market quote rather than baseline. */
  live: boolean;
}

const TAG_ACCENT: Record<IdeaTemplate["tag"], string> = {
  Bullish: "text-accent-lime border-accent-lime/30 bg-accent-lime/10",
  Bearish: "text-accent-rose border-accent-rose/30 bg-accent-rose/10",
  Vol: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10",
  Speculative: "text-accent-amber border-accent-amber/30 bg-accent-amber/10",
  Income: "text-accent-violet border-accent-violet/30 bg-accent-violet/10",
};

export function tagAccent(tag: IdeaTemplate["tag"]): string {
  return TAG_ACCENT[tag];
}

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const now = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate()
  );
  return Math.floor((now - start) / 86_400_000);
}

function roundStrike(spot: number): number {
  if (spot >= 10000) return Math.round(spot / 100) * 100;
  if (spot >= 1000) return Math.round(spot / 50) * 50;
  if (spot >= 100) return Math.round(spot / 5) * 5;
  return Math.round(spot);
}

function ideaFromTemplate(
  tpl: IdeaTemplate,
  rotation: number,
  livePrices: Record<string, number>
): DailyIdea {
  const sym = tpl.pool[rotation % tpl.pool.length];
  const ticker = findTicker(sym);
  const livePrice = livePrices[sym];
  const spot = livePrice ?? ticker.spotSeed;
  const strike = roundStrike(spot * (1 + tpl.strikeOffsetPct / 100));
  const sigmaPct = (ticker.baselineVol ?? 22) + (tpl.volBias ?? 0);
  const sigma = sigmaPct / 100;
  const r = 0.07;
  const result = priceBSM({
    spot,
    strike,
    daysToExpiry: tpl.daysToExpiry,
    volatility: sigma,
    riskFreeRate: r,
    type: tpl.type,
  });
  const lot = ticker.lotSize ?? 1;
  const costPerLot = result.price * lot;

  // 1σ favorable move as a "target"
  const T = tpl.daysToExpiry / 365;
  const stdDev = spot * sigma * Math.sqrt(T);
  const dir = tpl.type === "call" ? 1 : -1;
  const targetSpot = spot + dir * stdDev;
  const intrinsicAtTarget =
    tpl.type === "call"
      ? Math.max(targetSpot - strike, 0)
      : Math.max(strike - targetSpot, 0);
  const projectedProfitPerLot = intrinsicAtTarget * lot - costPerLot;
  const projectedRoiPct =
    costPerLot > 0 ? (projectedProfitPerLot / costPerLot) * 100 : 0;

  return {
    id: `${tpl.id}:${sym}`,
    title: tpl.title,
    thesis: tpl.thesis,
    ticker,
    type: tpl.type,
    spot,
    strike,
    strikeOffsetPct: tpl.strikeOffsetPct,
    daysToExpiry: tpl.daysToExpiry,
    volatility: sigmaPct,
    riskFreeRate: 7,
    premium: result.price,
    lotSize: lot,
    costPerLot,
    targetSpot,
    targetMovePct: ((targetSpot - spot) / spot) * 100,
    projectedProfitPerLot,
    projectedRoiPct,
    maxLossPerLot: -costPerLot,
    breakEven: result.breakEven,
    breakEvenPct: result.breakEvenPct,
    tag: tpl.tag,
    live: typeof livePrice === "number",
  };
}

export function generateDailyIdeas(
  now: Date,
  livePrices: Record<string, number> = {}
): DailyIdea[] {
  const seed = dayOfYear(now);
  return TEMPLATES.map((tpl, i) => ideaFromTemplate(tpl, seed + i, livePrices));
}

/** Symbols used across all ideas — handy for batch live-price fetching. */
export const IDEA_TICKERS: string[] = Array.from(
  new Set(TEMPLATES.flatMap((t) => t.pool))
).filter((s) => TICKERS.some((t) => t.symbol === s));
