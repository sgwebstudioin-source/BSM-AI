/**
 * Gemini-powered volatility predictor.
 *
 * Asks Gemini to analyze the live market context for an Indian-market ticker
 * and return a JSON-shaped { volatility, insight, sources } payload, with
 * Google Search grounding so we can cite where the analysis came from.
 *
 * Falls back to a deterministic heuristic when VITE_API_KEY is absent so the
 * dashboard remains functional in demo mode.
 */

import { GoogleGenAI } from "@google/genai";
import type { TickerMeta } from "../data/tickers";

export interface VolatilityForecast {
  /** Annualised implied volatility as a percentage (e.g. 22.5 for 22.5%). */
  volatility: number;
  /** Short, human-readable rationale. */
  insight: string;
  /** Optional grounding sources from Google Search. */
  sources: { title: string; uri: string }[];
  /** True when the result came from the live model rather than a fallback. */
  ai: boolean;
}

const MODEL = "gemini-2.5-flash";

function getClient(): GoogleGenAI | null {
  const key = import.meta.env.VITE_API_KEY;
  if (!key) return null;
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch {
    return null;
  }
}

function buildPrompt(t: TickerMeta): string {
  return [
    `You are a quantitative volatility analyst covering the Indian equity market (NSE).`,
    `Forecast the forward 30-day annualized implied volatility for ${t.symbol} (${t.name}).`,
    `Consider: recent realized volatility, India VIX regime, sector flows,`,
    `upcoming earnings, RBI/macro events, and news from the last 7 days.`,
    ``,
    `Return ONLY a compact JSON object — no prose, no markdown fences — with this shape:`,
    `{`,
    `  "volatility": <number, percent, e.g. 22.5>,`,
    `  "insight": "<2-3 sentences explaining the regime, drivers, and key risk>"`,
    `}`,
    ``,
    `Rules:`,
    `- volatility must be between 5 and 120.`,
    `- Be specific about WHY (e.g. "elevated due to Reliance earnings on Friday").`,
    `- If uncertain, anchor near India VIX and explain.`,
  ].join("\n");
}

interface ParsedJson {
  volatility?: number;
  insight?: string;
}

function tryParse(text: string): ParsedJson | null {
  if (!text) return null;
  // Strip ```json fences if Gemini sneaks one in.
  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();
  // Extract first {...} object if there's leading/trailing text.
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as ParsedJson;
  } catch {
    return null;
  }
}

function fallbackForecast(t: TickerMeta): VolatilityForecast {
  // Deterministic but plausible — index < liquid stock < momentum stock.
  const base =
    t.symbol === "NIFTY"
      ? 13.5
      : t.symbol === "BANKNIFTY"
      ? 17
      : t.baselineVol ?? 24;
  return {
    volatility: base,
    insight: `Demo mode: showing baseline ~${base.toFixed(
      1
    )}% volatility for ${t.symbol}. Add a VITE_API_KEY to enable live Gemini-driven forecasts.`,
    sources: [],
    ai: false,
  };
}

interface GroundingChunk {
  web?: { uri?: string; title?: string };
}

interface ResponseLike {
  text?: string | (() => string);
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: { groundingChunks?: GroundingChunk[] };
  }>;
}

function extractText(resp: ResponseLike): string {
  if (typeof resp.text === "function") return resp.text();
  if (typeof resp.text === "string") return resp.text;
  const parts = resp.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? "").join("");
}

function extractSources(resp: ResponseLike): { title: string; uri: string }[] {
  const chunks = resp.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const out: { title: string; uri: string }[] = [];
  for (const c of chunks) {
    if (c.web?.uri) {
      out.push({
        title: c.web.title ?? c.web.uri,
        uri: c.web.uri,
      });
    }
  }
  return out;
}

export async function predictVolatility(
  ticker: TickerMeta
): Promise<VolatilityForecast> {
  const ai = getClient();
  if (!ai) return fallbackForecast(ticker);

  try {
    const resp = (await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(ticker),
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.4,
      },
    })) as ResponseLike;

    const text = extractText(resp);
    const parsed = tryParse(text);
    if (!parsed || typeof parsed.volatility !== "number") {
      return {
        ...fallbackForecast(ticker),
        insight: `Model response was not parseable; falling back to baseline. Raw: ${text.slice(
          0,
          120
        )}`,
      };
    }
    const vol = Math.max(5, Math.min(120, parsed.volatility));
    return {
      volatility: vol,
      insight: parsed.insight ?? "No rationale provided.",
      sources: extractSources(resp),
      ai: true,
    };
  } catch (err) {
    const fb = fallbackForecast(ticker);
    return {
      ...fb,
      insight: `Gemini call failed (${
        err instanceof Error ? err.message : "unknown error"
      }). Showing baseline.`,
    };
  }
}
