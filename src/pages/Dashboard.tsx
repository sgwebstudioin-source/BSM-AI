import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  LogOut,
  Save,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";

import { BrandMark } from "../components/BrandMark";
import { TickerSelector } from "../components/TickerSelector";
import { InputField } from "../components/InputField";
import { GreeksGrid } from "../components/GreeksGrid";
import { PriceChart } from "../components/PriceChart";
import { PayoffChart } from "../components/PayoffChart";
import { InsightCard } from "../components/InsightCard";
import { ScenarioPresets, type Scenario } from "../components/ScenarioPresets";
import { SavedAnalysesPanel } from "../components/SavedAnalysesPanel";
import { DailyIdeas } from "../components/DailyIdeas";
import { ProfitProjectionPanel } from "../components/ProfitProjection";

import { TICKERS, DEFAULT_TICKER, type TickerMeta } from "../data/tickers";
import { buildHistory, latestSpot, type PricePoint } from "../data/priceHistory";
import { payoffCurve, priceBSM, type OptionType } from "../services/bsm";
import { projectProfit } from "../services/profit";
import { predictVolatility, type VolatilityForecast } from "../services/gemini";
import {
  fetchHistory,
  fetchLivePrices,
  fetchLiveQuote,
  isLiveSymbol,
  type LiveQuote,
} from "../services/marketData";
import {
  generateDailyIdeas,
  IDEA_TICKERS,
  type DailyIdea,
} from "../services/dailyIdeas";
import { useAuth } from "../context/AuthContext";
import {
  deleteAnalysis,
  listAnalyses,
  saveAnalysis,
  type SavedAnalysis,
} from "../services/firebase";

const RISK_FREE_DEFAULT = 7;

export default function Dashboard() {
  const { user, demo, signOut, configured } = useAuth();
  const nav = useNavigate();

  // ----- inputs -----
  const [ticker, setTicker] = useState<TickerMeta>(DEFAULT_TICKER);
  const [history, setHistory] = useState<PricePoint[]>(() =>
    buildHistory(DEFAULT_TICKER, 90)
  );
  const [historyLive, setHistoryLive] = useState(false);
  const [quote, setQuote] = useState<LiveQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [spot, setSpot] = useState<number>(DEFAULT_TICKER.spotSeed);
  const [strike, setStrike] = useState<number>(roundStrike(DEFAULT_TICKER.spotSeed));
  const [days, setDays] = useState<number>(30);
  const [rate, setRate] = useState<number>(RISK_FREE_DEFAULT);
  const [type, setType] = useState<OptionType>("call");

  // Strike auto-syncs to spot until the user manually edits it.
  const userTouchedStrike = useRef(false);
  // When a daily idea is applied we want to override the auto-spot/strike with
  // the idea's exact values once live data arrives — this ref carries the
  // pending override across the async ticker-change effect.
  const pendingApply = useRef<{
    strike: number;
    days: number;
    type: OptionType;
  } | null>(null);

  // ----- Gemini volatility forecast -----
  const [forecast, setForecast] = useState<VolatilityForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  const refreshForecast = useCallback(async (t: TickerMeta) => {
    setForecastLoading(true);
    try {
      const f = await predictVolatility(t);
      setForecast(f);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  // ----- Per-ticker effect: live quote + history + AI vol -----
  useEffect(() => {
    let cancelled = false;
    setQuoteLoading(true);
    setForecast(null);

    // Synthetic baseline available immediately while live data fetches.
    const synthHistory = buildHistory(ticker, 90);
    setHistory(synthHistory);
    setHistoryLive(false);

    const fallbackPrice = latestSpot(synthHistory);

    Promise.all([
      fetchLiveQuote(ticker.symbol, fallbackPrice),
      fetchHistory(ticker.symbol, synthHistory),
    ])
      .then(([q, h]) => {
        if (cancelled) return;
        setQuote(q);
        setHistory(h.data);
        setHistoryLive(h.live);

        // Apply pending idea override (if any) or sync spot/strike to live.
        const apply = pendingApply.current;
        pendingApply.current = null;
        const newSpot = q.price;
        setSpot(newSpot);
        if (apply) {
          // Recompute strike from idea offset against live spot if we have it.
          setType(apply.type);
          setDays(apply.days);
          setStrike(apply.strike);
          userTouchedStrike.current = true;
        } else if (!userTouchedStrike.current) {
          setStrike(roundStrike(newSpot));
        }
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false);
      });

    refreshForecast(ticker);

    return () => {
      cancelled = true;
    };
  }, [ticker, refreshForecast]);

  // When the user manually changes the strike, stop auto-syncing.
  function handleStrikeChange(n: number) {
    userTouchedStrike.current = true;
    setStrike(n);
  }
  function handleSpotChange(n: number) {
    setSpot(n);
  }

  // ----- BSM compute -----
  const sigma = (forecast?.volatility ?? ticker.baselineVol ?? 22) / 100;

  const result = useMemo(
    () =>
      priceBSM({
        spot,
        strike,
        daysToExpiry: days,
        volatility: sigma,
        riskFreeRate: rate / 100,
        type,
      }),
    [spot, strike, days, sigma, rate, type]
  );

  const payoff = useMemo(
    () => payoffCurve(result.inputs, result.price),
    [result]
  );

  const projection = useMemo(
    () => projectProfit(result, ticker.lotSize ?? 1),
    [result, ticker.lotSize]
  );

  // ----- Daily Ideas -----
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [livePricesLoaded, setLivePricesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchLivePrices(IDEA_TICKERS).then((map) => {
      if (cancelled) return;
      setLivePrices(map);
      setLivePricesLoaded(Object.keys(map).length > 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ideas = useMemo<DailyIdea[]>(
    () => generateDailyIdeas(new Date(), livePrices),
    [livePrices]
  );

  function applyIdea(idea: DailyIdea) {
    pendingApply.current = {
      strike: idea.strike,
      days: idea.daysToExpiry,
      type: idea.type,
    };
    if (idea.ticker.symbol === ticker.symbol) {
      // Same ticker — apply immediately; effect won't re-run.
      pendingApply.current = null;
      setType(idea.type);
      setDays(idea.daysToExpiry);
      setStrike(idea.strike);
      setSpot(idea.spot);
      userTouchedStrike.current = true;
    } else {
      setTicker(idea.ticker);
    }
    // Smooth scroll to the top of the dashboard so user sees the result.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // ----- Saved analyses -----
  const [saved, setSaved] = useState<SavedAnalysis[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "ok" | "err">(
    "idle"
  );

  const loadSaved = useCallback(async () => {
    if (!user) return;
    try {
      setSaved(await listAnalyses(user.uid));
    } catch {
      // Firestore may not be reachable in some demos — keep panel empty.
    }
  }, [user]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  async function handleSave() {
    if (!user) return;
    setSaveStatus("saving");
    try {
      await saveAnalysis(
        user.uid,
        {
          ticker: ticker.symbol,
          spot,
          strike,
          daysToExpiry: days,
          volatility: forecast?.volatility ?? (ticker.baselineVol ?? 22),
          riskFreeRate: rate,
          type,
        },
        {
          price: result.price,
          delta: result.greeks.delta,
          gamma: result.greeks.gamma,
          theta: result.greeks.theta,
          vega: result.greeks.vega,
          rho: result.greeks.rho,
          breakEven: result.breakEven,
        },
        forecast?.insight
      );
      setSaveStatus("ok");
      loadSaved();
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("err");
      setTimeout(() => setSaveStatus("idle"), 1800);
    }
  }

  function handleLoadSaved(a: SavedAnalysis) {
    const t = TICKERS.find((x) => x.symbol === a.inputs.ticker) ?? DEFAULT_TICKER;
    pendingApply.current = {
      strike: a.inputs.strike,
      days: a.inputs.daysToExpiry,
      type: a.inputs.type,
    };
    setTicker(t);
    setForecast({
      volatility: a.inputs.volatility,
      insight: a.insight ?? "Loaded from a saved analysis.",
      sources: [],
      ai: false,
    });
  }

  async function handleDeleteSaved(id: string) {
    if (!user) return;
    await deleteAnalysis(user.uid, id);
    loadSaved();
  }

  function applyScenario(s: Scenario) {
    setType(s.type);
    setDays(s.daysToExpiry);
    const offset = (s.strikeOffsetPct / 100) * spot;
    setStrike(roundStrike(spot + (s.type === "call" ? offset : -offset)));
    userTouchedStrike.current = true;
    if (s.volBias && forecast) {
      setForecast({
        ...forecast,
        volatility: Math.max(5, Math.min(120, forecast.volatility + s.volBias)),
      });
    }
  }

  async function handleSignOut() {
    await signOut();
    nav("/");
  }

  async function handleRefreshQuote() {
    setQuoteLoading(true);
    try {
      const q = await fetchLiveQuote(ticker.symbol, spot);
      setQuote(q);
      if (q.live) {
        setSpot(q.price);
        if (!userTouchedStrike.current) setStrike(roundStrike(q.price));
      }
    } finally {
      setQuoteLoading(false);
    }
  }

  function handleResetStrikeToSpot() {
    userTouchedStrike.current = false;
    setStrike(roundStrike(spot));
  }

  const moneyness =
    type === "call"
      ? spot > strike
        ? "ITM"
        : spot < strike
        ? "OTM"
        : "ATM"
      : spot < strike
      ? "ITM"
      : spot > strike
      ? "OTM"
      : "ATM";

  const liveBadge = quote?.live ? "live" : "demo";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative min-h-screen pb-16"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-grid-glow" />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/5 bg-ink-950/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-white" aria-label="Home">
              <ArrowLeft size={18} />
            </Link>
            <BrandMark />
            <span className="hidden chip md:inline-flex">
              <CircleDot size={10} className="text-accent-lime animate-pulse" />
              {demo && !user ? "Demo session" : configured ? "Live" : "Local"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden text-right text-xs sm:block">
                  <div className="font-medium text-slate-200">
                    {user.displayName ?? user.email}
                  </div>
                  <div className="text-slate-500">Signed in</div>
                </div>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full border border-white/10"
                  />
                ) : null}
                <button onClick={handleSignOut} className="btn-ghost px-3 py-2">
                  <LogOut size={14} /> Sign out
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-500">Demo mode · no save</span>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-6 space-y-5">
        {/* Daily Ideas — full width at the top */}
        <DailyIdeas
          ideas={ideas}
          onApply={applyIdea}
          livePricesLoaded={livePricesLoaded}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left rail — controls */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
            <section className="glass p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-sm font-semibold text-slate-100">
                    Underlying
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Pick an NSE index or F&O stock.
                  </p>
                </div>
                <button
                  onClick={handleRefreshQuote}
                  className="btn-ghost px-2.5 py-1.5 text-[11px]"
                  disabled={quoteLoading}
                  title="Refresh live price"
                >
                  {quote?.live ? (
                    <Wifi size={12} className="text-accent-lime" />
                  ) : (
                    <WifiOff size={12} className="text-slate-500" />
                  )}
                  {quoteLoading
                    ? "Fetching…"
                    : quote?.live
                    ? "Live"
                    : isLiveSymbol(ticker.symbol)
                    ? "Retry"
                    : "Demo"}
                </button>
              </div>

              {quote && (
                <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500">
                      Current price
                    </span>
                    {quote.live && (
                      <span className="text-[10px] text-slate-500">
                        as of{" "}
                        {new Date(quote.asOf).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-end gap-2">
                    <span className="font-display text-xl font-semibold text-slate-50">
                      ₹
                      {quote.price.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {quote.live && (
                      <span
                        className={
                          "text-xs font-semibold " +
                          (quote.change >= 0
                            ? "text-accent-lime"
                            : "text-accent-rose")
                        }
                      >
                        {quote.change >= 0 ? "+" : ""}
                        {quote.change.toFixed(2)} ({quote.changePct >= 0 ? "+" : ""}
                        {quote.changePct.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <TickerSelector value={ticker} onChange={setTicker} />
              </div>
            </section>

            <section className="glass p-5">
              <h2 className="font-display text-sm font-semibold text-slate-100">
                Contract
              </h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  <button
                    onClick={() => setType("call")}
                    className={
                      "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition " +
                      (type === "call"
                        ? "bg-accent-lime/15 text-accent-lime"
                        : "text-slate-400 hover:text-slate-200")
                    }
                  >
                    Call
                  </button>
                  <button
                    onClick={() => setType("put")}
                    className={
                      "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition " +
                      (type === "put"
                        ? "bg-accent-rose/15 text-accent-rose"
                        : "text-slate-400 hover:text-slate-200")
                    }
                  >
                    Put
                  </button>
                </div>

                <InputField
                  label="Spot price"
                  hint={quote?.live ? "live" : "demo"}
                  value={spot}
                  onChange={handleSpotChange}
                  step={ticker.kind === "index" ? 1 : 0.05}
                  suffix="₹"
                />
                <div>
                  <InputField
                    label="Strike price"
                    value={strike}
                    onChange={handleStrikeChange}
                    step={ticker.kind === "index" ? 50 : 1}
                    suffix="₹"
                  />
                  {userTouchedStrike.current && (
                    <button
                      onClick={handleResetStrikeToSpot}
                      className="mt-1.5 text-[11px] text-accent-cyan hover:underline"
                    >
                      Reset strike to current spot
                    </button>
                  )}
                </div>
                <InputField
                  label="Days to expiry"
                  value={days}
                  onChange={(n) => setDays(Math.max(0, Math.round(n)))}
                  min={0}
                  max={365}
                  step={1}
                  suffix="d"
                  withSlider
                />
                <InputField
                  label="Risk-free rate"
                  hint="RBI proxy"
                  value={rate}
                  onChange={setRate}
                  min={0}
                  max={15}
                  step={0.05}
                  suffix="%"
                  withSlider
                />
              </div>
            </section>

            <section className="glass p-5">
              <h2 className="font-display text-sm font-semibold text-slate-100">
                Quick scenarios
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Load complete setups in one click.
              </p>
              <div className="mt-4">
                <ScenarioPresets onApply={applyScenario} />
              </div>
            </section>
          </aside>

          {/* Center — pricing + greeks + charts */}
          <section className="lg:col-span-8 xl:col-span-6 space-y-5">
            <div className="glass-strong relative overflow-hidden p-6">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent-violet/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent-cyan/15 blur-3xl" />

              <div className="relative flex flex-wrap items-center gap-3">
                <span className="chip">
                  <span className="font-mono">{ticker.symbol}</span>
                  <ChevronRight size={10} className="text-slate-500" />
                  {ticker.name}
                </span>
                <span
                  className={
                    "chip " +
                    (type === "call"
                      ? "border-accent-lime/30 bg-accent-lime/10 text-accent-lime"
                      : "border-accent-rose/30 bg-accent-rose/10 text-accent-rose")
                  }
                >
                  {type.toUpperCase()} · {moneyness}
                </span>
                <span className="chip">
                  <Sparkles size={11} className="text-accent-cyan" />
                  σ {(sigma * 100).toFixed(2)}%
                </span>
                <span className="chip">{days}d to expiry</span>
                <span
                  className={
                    "chip " +
                    (quote?.live
                      ? "border-accent-lime/30 bg-accent-lime/10 text-accent-lime"
                      : "border-white/10 text-slate-400")
                  }
                >
                  {quote?.live ? <Wifi size={11} /> : <WifiOff size={11} />}
                  Spot · {liveBadge}
                </span>
              </div>

              <div className="relative mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <BigStat
                  label="Fair value"
                  value={`₹${fmt(result.price)}`}
                  accent="text-accent-cyan"
                />
                <BigStat
                  label="Intrinsic"
                  value={`₹${fmt(result.intrinsic)}`}
                  sub={`Extrinsic ₹${fmt(result.extrinsic)}`}
                />
                <BigStat
                  label="Break-even"
                  value={`₹${fmt(result.breakEven)}`}
                  sub={`${result.breakEvenPct >= 0 ? "+" : ""}${result.breakEvenPct.toFixed(
                    2
                  )}% from spot`}
                  accent={
                    Math.abs(result.breakEvenPct) < 2
                      ? "text-accent-lime"
                      : Math.abs(result.breakEvenPct) > 8
                      ? "text-accent-rose"
                      : "text-accent-amber"
                  }
                />
                <BigStat
                  label={`Implied σ (${forecast?.ai ? "AI" : "demo"})`}
                  value={`${(sigma * 100).toFixed(2)}%`}
                  sub={`d1 ${result.d1.toFixed(2)} · d2 ${result.d2.toFixed(2)}`}
                />
              </div>

              <div className="relative mt-6 flex items-center justify-end gap-2">
                {user ? (
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                    disabled={saveStatus === "saving"}
                  >
                    {saveStatus === "ok" ? (
                      <>
                        <CheckCircle2 size={14} /> Saved
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Save analysis
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">
                    Sign in to save analyses to Firestore.
                  </span>
                )}
              </div>
            </div>

            <ProfitProjectionPanel
              projection={projection}
              ticker={ticker.symbol}
              optionType={type}
            />

            <div className="glass p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-slate-100">
                  Greeks
                </h3>
                <span className="text-xs text-slate-500">
                  Computed locally · BSM closed-form
                </span>
              </div>
              <GreeksGrid greeks={result.greeks} />
            </div>

            <div className="glass p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-slate-100">
                  Underlying — 90 day close
                </h3>
                <span className="text-xs text-slate-500">
                  {historyLive ? "Live NSE history" : "Synthetic baseline"} · Strike & BE overlays
                </span>
              </div>
              <PriceChart
                data={history}
                strike={strike}
                breakEven={result.breakEven}
              />
            </div>

            <div className="glass p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-slate-100">
                  Payoff at expiry
                </h3>
                <span className="text-xs text-slate-500">
                  Net of premium · long {type}
                </span>
              </div>
              <PayoffChart data={payoff} spot={spot} breakEven={result.breakEven} />
            </div>
          </section>

          {/* Right rail — AI insight + saved */}
          <aside className="lg:col-span-12 xl:col-span-3 space-y-5">
            <InsightCard
              forecast={forecast}
              loading={forecastLoading}
              onRefresh={() => refreshForecast(ticker)}
            />

            <div className="glass p-5">
              <div className="mb-3 flex items-center gap-2">
                <Bookmark size={14} className="text-accent-cyan" />
                <h3 className="font-display text-sm font-semibold text-slate-100">
                  Saved analyses
                </h3>
              </div>
              {user ? (
                <SavedAnalysesPanel
                  items={saved}
                  onLoad={handleLoadSaved}
                  onDelete={handleDeleteSaved}
                />
              ) : (
                <p className="text-xs text-slate-500">
                  Sign in with Google to persist analyses to your private vault.
                </p>
              )}
            </div>

            <div className="glass p-5 text-xs text-slate-500">
              <div className="font-semibold text-slate-300">Disclaimer</div>
              OptiModel AI is an educational tool. Theoretical prices, AI-driven
              volatility forecasts, and projected profits are not investment advice.
              Always validate with live market data before trading.
            </div>
          </aside>
        </div>
      </main>
    </motion.div>
  );
}

function BigStat({
  label,
  value,
  sub,
  accent = "text-slate-50",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="label">{label}</div>
      <div className={`mt-1.5 font-display text-2xl font-semibold ${accent}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function roundStrike(spot: number): number {
  if (spot >= 10000) return Math.round(spot / 100) * 100;
  if (spot >= 1000) return Math.round(spot / 50) * 50;
  if (spot >= 100) return Math.round(spot / 5) * 5;
  return Math.round(spot);
}
