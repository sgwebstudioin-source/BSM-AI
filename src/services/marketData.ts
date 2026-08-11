/**
 * Live market-data fetcher.
 *
 * Hits Yahoo Finance's public chart endpoint (no API key required) for
 * NSE-listed tickers. Yahoo returns CORS headers on this endpoint, so it
 * works directly from the browser. If the network call fails (CORS,
 * offline, rate limit), every function falls back to its caller-provided
 * synthetic data so the dashboard never breaks.
 */

import type { PricePoint } from "../data/priceHistory";

const YAHOO_SYMBOLS: Record<string, string> = {
  NIFTY: "^NSEI",
  BANKNIFTY: "^NSEBANK",
  FINNIFTY: "^CNXFIN",
  RELIANCE: "RELIANCE.NS",
  TCS: "TCS.NS",
  INFY: "INFY.NS",
  HDFCBANK: "HDFCBANK.NS",
  ICICIBANK: "ICICIBANK.NS",
  TATAMOTORS: "TATAMOTORS.NS",
  ADANIENT: "ADANIENT.NS",
};

const YAHOO_PATH = "/v8/finance/chart";
const YAHOO_HOST = "https://query1.finance.yahoo.com";

/**
 * Build the list of candidate URLs to try, in order.
 *
 * In dev we hit the Vite proxy on our own origin (`/yf/...`) — that forwards
 * to Yahoo server-side with a browser User-Agent, dodging both CORS and
 * Yahoo's 429 rate-limit. In a production build there is no dev proxy, so we
 * fall back to public CORS proxies that re-expose Yahoo with the right
 * headers. The direct Yahoo URL is tried last; it usually fails on CORS but
 * costs nothing to attempt and works in any environment that does proxy it.
 */
function candidateUrls(symbol: string, query: string): string[] {
  const path = `${YAHOO_PATH}/${encodeURIComponent(symbol)}?${query}`;
  const full = `${YAHOO_HOST}${path}`;
  if (import.meta.env?.DEV) {
    return [`/yf${path}`];
  }
  return [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(full)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(full)}`,
    full,
  ];
}

export interface LiveQuote {
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  live: boolean;
  asOf: number;
  currency?: string;
}

interface YahooChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketTime?: number;
  currency?: string;
}

interface YahooChartResult {
  meta?: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{ close?: (number | null)[] }>;
  };
}

interface YahooChartResponse {
  chart?: { result?: YahooChartResult[] };
}

async function fetchYahoo(
  symbol: string,
  range: string,
  interval: string
): Promise<YahooChartResult | null> {
  const query = `interval=${interval}&range=${range}`;
  let lastErr: unknown = null;
  for (const url of candidateUrls(symbol, query)) {
    try {
      const resp = await fetch(url, { headers: { Accept: "application/json" } });
      if (!resp.ok) throw new Error("Yahoo HTTP " + resp.status);
      const json = (await resp.json()) as YahooChartResponse;
      const result = json?.chart?.result?.[0];
      if (result) return result;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

export async function fetchLiveQuote(
  appSymbol: string,
  fallbackPrice: number
): Promise<LiveQuote> {
  const yh = YAHOO_SYMBOLS[appSymbol];
  if (!yh) return demoQuote(fallbackPrice);
  try {
    const r = await fetchYahoo(yh, "5d", "1d");
    const meta = r?.meta;
    const price = meta?.regularMarketPrice;
    if (typeof price !== "number" || !Number.isFinite(price)) {
      return demoQuote(fallbackPrice);
    }
    const prev =
      meta?.chartPreviousClose ?? meta?.previousClose ?? price;
    return {
      price,
      prevClose: prev,
      change: price - prev,
      changePct: prev ? ((price - prev) / prev) * 100 : 0,
      live: true,
      asOf: (meta?.regularMarketTime ?? 0) * 1000 || Date.now(),
      currency: meta?.currency ?? "INR",
    };
  } catch {
    return demoQuote(fallbackPrice);
  }
}

export async function fetchHistory(
  appSymbol: string,
  fallback: PricePoint[]
): Promise<{ data: PricePoint[]; live: boolean }> {
  const yh = YAHOO_SYMBOLS[appSymbol];
  if (!yh) return { data: fallback, live: false };
  try {
    const r = await fetchYahoo(yh, "3mo", "1d");
    const ts = r?.timestamp ?? [];
    const closes = r?.indicators?.quote?.[0]?.close ?? [];
    const out: PricePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (typeof c !== "number" || !Number.isFinite(c)) continue;
      const t = ts[i] * 1000;
      out.push({
        t,
        date: new Date(t).toISOString().slice(0, 10),
        close: Math.round(c * 100) / 100,
      });
    }
    if (out.length < 5) return { data: fallback, live: false };
    return { data: out, live: true };
  } catch {
    return { data: fallback, live: false };
  }
}

/**
 * Fetch live quotes for many tickers in parallel. Returns a symbol→price map
 * containing only successful, "live" responses.
 */
export async function fetchLivePrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    symbols.map(async (s) => {
      const q = await fetchLiveQuote(s, 0);
      return [s, q] as const;
    })
  );
  const out: Record<string, number> = {};
  for (const [s, q] of entries) {
    if (q.live) out[s] = q.price;
  }
  return out;
}

function demoQuote(price: number): LiveQuote {
  return {
    price,
    prevClose: price,
    change: 0,
    changePct: 0,
    live: false,
    asOf: Date.now(),
    currency: "INR",
  };
}

export function isLiveSymbol(appSymbol: string): boolean {
  return appSymbol in YAHOO_SYMBOLS;
}
