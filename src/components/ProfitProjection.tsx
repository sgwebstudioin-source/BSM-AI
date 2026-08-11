import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { ProfitProjection as Projection } from "../services/profit";

interface Props {
  projection: Projection;
  ticker: string;
  optionType: "call" | "put";
}

export function ProfitProjectionPanel({ projection, ticker, optionType }: Props) {
  const { scenarios, costPerLot, maxLossPerLot, lotSize, breakEven } =
    projection;

  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Profit projection · per lot at expiry
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Lot size {lotSize.toLocaleString("en-IN")}. Premium paid is the only
            money at risk for a long {optionType}.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-right">
          <div className="label">You pay</div>
          <div className="mt-0.5 font-display text-base font-semibold text-slate-50">
            ₹{fmtCompact(costPerLot)}
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">
            ₹{projection.premiumPerShare.toFixed(2)} × {lotSize}
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {scenarios.map((s) => {
          const positive = s.pnlPerLot > 0.5;
          const negative = s.pnlPerLot < -0.5;
          const colour = positive
            ? "text-accent-lime"
            : negative
            ? "text-accent-rose"
            : "text-slate-300";
          return (
            <div
              key={s.label}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
            >
              <div>
                <div className="text-xs font-medium text-slate-200">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500">
                  {ticker} ₹{fmtShort(s.spot)}{" "}
                  <span className="text-slate-600">·</span>{" "}
                  {s.spotDeltaPct >= 0 ? "+" : ""}
                  {s.spotDeltaPct.toFixed(2)}%
                </div>
              </div>
              <div className={"flex items-center gap-1.5 " + colour}>
                {positive ? (
                  <TrendingUp size={13} />
                ) : negative ? (
                  <TrendingDown size={13} />
                ) : (
                  <Wallet size={13} className="text-slate-500" />
                )}
                <span className="font-mono text-sm font-semibold">
                  {s.pnlPerLot >= 0 ? "+" : "−"}₹
                  {fmtCompact(Math.abs(s.pnlPerLot))}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 px-3 py-2 text-accent-rose">
          <div className="opacity-70">Worst case</div>
          <div className="mt-0.5 font-mono text-sm font-semibold">
            −₹{fmtCompact(Math.abs(maxLossPerLot))}
          </div>
        </div>
        <div className="rounded-lg border border-accent-amber/20 bg-accent-amber/5 px-3 py-2 text-accent-amber">
          <div className="opacity-70">Break-even spot</div>
          <div className="mt-0.5 font-mono text-sm font-semibold">
            ₹{fmtShort(breakEven)}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 100000) return (n / 100000).toFixed(2) + "L";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toFixed(0);
}
function fmtShort(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
