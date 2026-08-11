import { Brain, ExternalLink, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import type { VolatilityForecast } from "../services/gemini";

interface Props {
  forecast: VolatilityForecast | null;
  loading: boolean;
  onRefresh: () => void;
}

export function InsightCard({ forecast, loading, onRefresh }: Props) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-violet/15 text-accent-violet">
            <Brain size={16} />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Gemini IV forecast
            </div>
            <div className="text-xs text-slate-500">
              {forecast?.ai
                ? "Live, grounded with Google Search"
                : "Demo baseline (add VITE_API_KEY for live)"}
            </div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="btn-ghost px-3 py-2"
          disabled={loading}
          aria-label="Refresh forecast"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCcw size={14} />
          )}
          Refresh
        </button>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <div className="font-display text-4xl font-semibold tracking-tight text-slate-50">
          {forecast ? forecast.volatility.toFixed(1) : "—"}
          <span className="ml-1 text-xl text-slate-400">%</span>
        </div>
        {forecast?.ai && (
          <span className="chip border-accent-lime/30 bg-accent-lime/10 text-accent-lime">
            <Sparkles size={11} />
            AI
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        {forecast?.insight ?? "Awaiting first forecast…"}
      </p>

      {forecast?.sources && forecast.sources.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <div className="label mb-2">Sources</div>
          <ul className="space-y-1.5">
            {forecast.sources.slice(0, 5).map((s, i) => (
              <li key={i}>
                <a
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-start gap-1.5 text-xs text-slate-400 hover:text-accent-cyan"
                >
                  <ExternalLink
                    size={11}
                    className="mt-0.5 shrink-0 opacity-60 group-hover:opacity-100"
                  />
                  <span className="line-clamp-1">{s.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
