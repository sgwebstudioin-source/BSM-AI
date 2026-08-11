import { TICKERS, type TickerMeta } from "../data/tickers";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  value: TickerMeta;
  onChange: (t: TickerMeta) => void;
}

export function TickerSelector({ value, onChange }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TICKERS;
    return TICKERS.filter(
      (t) =>
        t.symbol.toLowerCase().includes(needle) ||
        t.name.toLowerCase().includes(needle)
    );
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search NSE tickers…"
          className="input pl-9"
          aria-label="Search tickers"
        />
      </div>
      <div className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
        {filtered.map((t) => {
          const active = t.symbol === value.symbol;
          return (
            <button
              key={t.symbol}
              type="button"
              onClick={() => onChange(t)}
              className={
                "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition " +
                (active
                  ? "border-accent-cyan/40 bg-accent-cyan/10 text-slate-50"
                  : "border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/15 hover:bg-white/[0.04]")
              }
            >
              <div className="flex flex-col">
                <span className="font-mono text-sm font-semibold">
                  {t.symbol}
                </span>
                <span className="text-xs text-slate-500">{t.name}</span>
              </div>
              <span
                className={
                  "chip " +
                  (t.kind === "index"
                    ? "border-accent-violet/30 bg-accent-violet/10 text-accent-violet"
                    : "border-accent-cyan/20 bg-accent-cyan/5 text-accent-cyan")
                }
              >
                {t.kind}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-500">
            No tickers match "{q}".
          </div>
        )}
      </div>
    </div>
  );
}
