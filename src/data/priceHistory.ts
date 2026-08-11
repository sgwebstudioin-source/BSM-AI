import type { TickerMeta } from "./tickers";

/**
 * Deterministic synthetic price history for the chart.
 * In a real deployment this would come from a market-data API; using a seeded
 * walk keeps the dashboard demo-ready without third-party data plumbing.
 */
export interface PricePoint {
  t: number; // unix ms
  date: string; // YYYY-MM-DD
  close: number;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildHistory(ticker: TickerMeta, days = 90): PricePoint[] {
  const rng = mulberry32(hash(ticker.symbol));
  const sigmaDaily = (ticker.baselineVol ?? 22) / 100 / Math.sqrt(252);
  const drift = 0.00015;
  const out: PricePoint[] = [];
  let price = ticker.spotSeed * (0.92 + rng() * 0.16);
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const z = boxMuller(rng);
    price = price * Math.exp(drift + sigmaDaily * z);
    const t = now - i * 86_400_000;
    const d = new Date(t);
    out.push({
      t,
      date: d.toISOString().slice(0, 10),
      close: Math.round(price * 100) / 100,
    });
  }
  return out;
}

function boxMuller(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function latestSpot(history: PricePoint[]): number {
  return history[history.length - 1]?.close ?? 0;
}
