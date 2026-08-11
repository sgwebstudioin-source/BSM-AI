import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Crosshair,
  Sparkles,
  TrendingUp,
  WifiOff,
} from "lucide-react";
import { type DailyIdea, tagAccent } from "../services/dailyIdeas";

interface Props {
  ideas: DailyIdea[];
  onApply: (idea: DailyIdea) => void;
  livePricesLoaded: boolean;
}

export function DailyIdeas({ ideas, onApply, livePricesLoaded }: Props) {
  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent-lime" />
            <h3 className="font-display text-sm font-semibold text-slate-100">
              Today's Trade Ideas
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            5 setups for {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
            {" — "}click any to load it into the dashboard.
          </p>
        </div>
        <span className="chip">
          {livePricesLoaded ? (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-lime" />
              Live NSE prices
            </>
          ) : (
            <>
              <WifiOff size={11} className="text-slate-500" />
              Baseline prices
            </>
          )}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {ideas.map((idea, i) => (
          <motion.button
            key={idea.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => onApply(idea)}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
          >
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl transition group-hover:bg-accent-cyan/15" />

            <div className="relative flex items-center justify-between">
              <span className={"chip " + tagAccent(idea.tag)}>{idea.tag}</span>
              <span className="font-mono text-xs text-slate-400">
                {idea.ticker.symbol}
              </span>
            </div>

            <div className="relative">
              <div className="text-sm font-semibold text-slate-100">
                {idea.title}
              </div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">
                {idea.thesis}
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-2 text-[11px]">
              <KV
                k="Type"
                v={
                  <span
                    className={
                      idea.type === "call"
                        ? "text-accent-lime"
                        : "text-accent-rose"
                    }
                  >
                    {idea.type.toUpperCase()}
                  </span>
                }
              />
              <KV k="Spot" v={`₹${fmt(idea.spot)}`} />
              <KV k="Strike" v={`₹${fmt(idea.strike)}`} />
              <KV
                k={
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={9} /> DTE
                  </span>
                }
                v={`${idea.daysToExpiry}d`}
              />
              <KV k="Premium" v={`₹${fmt(idea.premium)}`} />
              <KV k="Lot cost" v={`₹${fmtCompact(idea.costPerLot)}`} />
            </div>

            <div className="relative rounded-xl border border-white/5 bg-black/20 p-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Crosshair size={9} />
                  If {idea.ticker.symbol} reaches ₹
                  {fmtShort(idea.targetSpot)}
                </span>
                <span>
                  {idea.targetMovePct >= 0 ? "+" : ""}
                  {idea.targetMovePct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1.5 flex items-end gap-2">
                <span
                  className={
                    "font-display text-lg font-semibold " +
                    (idea.projectedProfitPerLot >= 0
                      ? "text-accent-lime"
                      : "text-accent-rose")
                  }
                >
                  {idea.projectedProfitPerLot >= 0 ? "+" : ""}₹
                  {fmtCompact(Math.abs(idea.projectedProfitPerLot))}
                </span>
                <span className="pb-0.5 text-[10px] text-slate-500">
                  per lot
                </span>
                <span
                  className={
                    "ml-auto pb-0.5 text-[10px] font-semibold " +
                    (idea.projectedRoiPct >= 0
                      ? "text-accent-lime"
                      : "text-accent-rose")
                  }
                >
                  {idea.projectedRoiPct >= 0 ? "+" : ""}
                  {idea.projectedRoiPct.toFixed(0)}% ROI
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Max loss ₹{fmtCompact(Math.abs(idea.maxLossPerLot))}</span>
                <span>BE ₹{fmtShort(idea.breakEven)}</span>
              </div>
            </div>

            <div className="relative flex items-center justify-between text-[11px] text-slate-400 transition group-hover:text-accent-cyan">
              <span className="inline-flex items-center gap-1">
                <TrendingUp size={11} />
                {idea.live ? "Live spot" : "Baseline spot"}
              </span>
              <span className="inline-flex items-center gap-1 font-medium">
                Apply <ArrowRight size={11} />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function KV({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{k}</span>
      <span className="font-mono text-slate-200">{v}</span>
    </div>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtShort(n: number): string {
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(1) + "L";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toFixed(0);
}
