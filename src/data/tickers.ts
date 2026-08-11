export interface TickerMeta {
  symbol: string;
  name: string;
  /** Approximate spot used as the initial seed in demo mode. */
  spotSeed: number;
  /** Lot/contract size for context — not used in BSM math itself. */
  lotSize?: number;
  /** Indicative annualised vol used as fallback when AI is unavailable. */
  baselineVol?: number;
  kind: "index" | "stock";
}

export const TICKERS: TickerMeta[] = [
  { symbol: "NIFTY", name: "Nifty 50 Index", spotSeed: 22500, lotSize: 50, baselineVol: 13, kind: "index" },
  { symbol: "BANKNIFTY", name: "Nifty Bank Index", spotSeed: 48500, lotSize: 15, baselineVol: 17, kind: "index" },
  { symbol: "FINNIFTY", name: "Nifty Financial Services", spotSeed: 21500, lotSize: 25, baselineVol: 16, kind: "index" },
  { symbol: "RELIANCE", name: "Reliance Industries", spotSeed: 2950, lotSize: 250, baselineVol: 22, kind: "stock" },
  { symbol: "TCS", name: "Tata Consultancy Services", spotSeed: 4100, lotSize: 175, baselineVol: 20, kind: "stock" },
  { symbol: "INFY", name: "Infosys", spotSeed: 1850, lotSize: 400, baselineVol: 24, kind: "stock" },
  { symbol: "HDFCBANK", name: "HDFC Bank", spotSeed: 1680, lotSize: 550, baselineVol: 19, kind: "stock" },
  { symbol: "ICICIBANK", name: "ICICI Bank", spotSeed: 1180, lotSize: 700, baselineVol: 21, kind: "stock" },
  { symbol: "TATAMOTORS", name: "Tata Motors", spotSeed: 980, lotSize: 1425, baselineVol: 32, kind: "stock" },
  { symbol: "ADANIENT", name: "Adani Enterprises", spotSeed: 2650, lotSize: 300, baselineVol: 38, kind: "stock" },
];

export const DEFAULT_TICKER = TICKERS[0];

export function findTicker(symbol: string): TickerMeta {
  return TICKERS.find((t) => t.symbol === symbol) ?? DEFAULT_TICKER;
}
