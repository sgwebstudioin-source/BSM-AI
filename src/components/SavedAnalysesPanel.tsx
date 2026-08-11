import { Trash2, Bookmark } from "lucide-react";
import type { SavedAnalysis } from "../services/firebase";

interface Props {
  items: SavedAnalysis[];
  onLoad: (item: SavedAnalysis) => void;
  onDelete: (id: string) => void;
  empty?: string;
}

export function SavedAnalysesPanel({ items, onLoad, onDelete, empty }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">
        {empty ?? "Saved analyses will appear here."}
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={it.id}
          className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/15"
        >
          <button
            onClick={() => onLoad(it)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.04] text-accent-cyan">
              <Bookmark size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <span className="font-mono">{it.inputs.ticker}</span>
                <span className="text-slate-500">·</span>
                <span className="uppercase tracking-wide text-slate-400">
                  {it.inputs.type}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">K {it.inputs.strike}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                ₹{it.result.price.toFixed(2)} · IV {it.inputs.volatility.toFixed(1)}% ·{" "}
                {new Date(it.createdAt).toLocaleDateString()}
              </div>
            </div>
          </button>
          <button
            onClick={() => onDelete(it.id)}
            className="rounded-lg p-2 text-slate-500 opacity-0 transition hover:bg-white/[0.05] hover:text-accent-rose group-hover:opacity-100"
            aria-label="Delete analysis"
          >
            <Trash2 size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
