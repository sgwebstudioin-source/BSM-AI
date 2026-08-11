import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Activity,
  Brain,
  LineChart,
  Sparkles,
  Lock,
  Zap,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Landing() {
  const { user, configured, signIn, enterDemo } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSignIn() {
    setErr(null);
    if (!configured) {
      enterDemo();
      nav("/dashboard");
      return;
    }
    setBusy(true);
    try {
      await signIn();
      nav("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  function tryDemo() {
    enterDemo();
    nav("/dashboard");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen overflow-hidden"
    >
      {/* Decorative grid + glow */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-grid-glow" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandMark />
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-slate-300 hover:text-white">
            Features
          </a>
          <a href="#engine" className="text-sm text-slate-300 hover:text-white">
            Engine
          </a>
          <a href="#flow" className="text-sm text-slate-300 hover:text-white">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Open dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <button onClick={handleSignIn} className="btn-primary" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-12 pt-12 pb-24 md:pt-20 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="chip mb-6"
            >
              <Sparkles size={12} className="text-accent-lime" />
              Hybrid BSM × Gemini · NSE
            </motion.div>

            <motion.h1
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-slate-50 md:text-6xl"
            >
              Theoretical option pricing,{" "}
              <span className="bg-gradient-to-r from-accent-cyan via-white to-accent-violet bg-clip-text text-transparent">
                tuned by live market sentiment.
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-6 max-w-xl text-lg text-slate-300"
            >
              OptiModel AI replaces static historical volatility with a Gemini-predicted IV
              forecast — grounded in real-time news and macro context — so your Black-Scholes
              fair value reflects the market you're actually trading.
            </motion.p>

            <motion.div
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button onClick={handleSignIn} className="btn-primary" disabled={busy}>
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.7 6.6 29.1 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10.5 0 19-8.5 19-19 0-1.2-.1-2.3-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.7 6.6 29.1 5 24 5 16.3 5 9.7 9.4 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 43c5.1 0 9.7-1.6 13.2-4.4l-6.1-5.2c-2 1.4-4.5 2.2-7.1 2.2-5.3 0-9.7-2.9-11.3-7l-6.6 5.1C9.6 38.8 16.3 43 24 43z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.1 5.2c-.4.4 6.6-4.8 6.6-14.5 0-1.2-.1-2.3-.4-3.5z"
                  />
                </svg>
                {configured ? "Continue with Google" : "Try the demo"}
                <ArrowRight size={16} />
              </button>
              <button onClick={tryDemo} className="btn-ghost">
                Explore without signing in
              </button>
            </motion.div>

            {!configured && (
              <p className="mt-4 max-w-xl text-xs text-slate-500">
                Firebase isn't configured yet — running in demo mode. Add{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-300">
                  src/firebase-config.json
                </code>{" "}
                or VITE_FIREBASE_* env vars to enable Google sign-in.
              </p>
            )}
            {err && <p className="mt-3 text-sm text-accent-rose">{err}</p>}

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                { k: "Tickers", v: "NIFTY · BANK · 8 stocks" },
                { k: "Risk-free", v: "≈ 7% (RBI)" },
                { k: "Greeks", v: "Δ Γ Θ ν ρ" },
              ].map((s) => (
                <div key={s.k} className="glass px-4 py-3">
                  <div className="label">{s.k}</div>
                  <div className="mt-1 text-sm font-medium text-slate-100">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Showcase card */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="md:col-span-5"
          >
            <div className="glass-strong relative overflow-hidden p-6">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-violet/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-accent-cyan/20 blur-3xl" />

              <div className="relative flex items-center justify-between">
                <div className="chip">
                  <Activity size={12} className="text-accent-cyan" />
                  NIFTY · 22,500 · CALL
                </div>
                <span className="chip">
                  <Brain size={12} className="text-accent-violet" />
                  Gemini IV
                </span>
              </div>

              <div className="relative mt-6 grid grid-cols-2 gap-3">
                <Stat label="Fair value" value="₹186.42" trend="+2.4%" />
                <Stat label="Predicted IV" value="14.2%" trend="vs 13% hist." />
                <Stat label="Δ Delta" value="0.58" />
                <Stat label="Θ Theta" value="−2.31/day" />
                <Stat label="ν Vega" value="18.4" />
                <Stat label="Break-even" value="22,686 (+0.83%)" />
              </div>

              <div className="relative mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sparkles size={12} className="text-accent-lime" />
                  Strategy insight
                </div>
                <p className="mt-1.5 text-sm text-slate-200">
                  Elevated IV reflects RBI policy week and fresh FII inflows — premium is
                  rich relative to 30-day realized.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="py-12">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-slate-50 md:text-3xl">
              Built for the way the Indian market actually moves.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Feature
              icon={<Brain size={18} />}
              title="AI-predicted volatility"
              body="Gemini analyses news, macro events, and India VIX context to forecast forward-looking IV — with cited sources."
            />
            <Feature
              icon={<LineChart size={18} />}
              title="Full Greeks panel"
              body="Delta, Gamma, Theta, Vega, Rho computed live as you tweak strike, days to expiry, and rate."
            />
            <Feature
              icon={<TrendingUp size={18} />}
              title="Break-even & moneyness"
              body="See intrinsic vs extrinsic split and the % move from spot needed to break even at expiry."
            />
            <Feature
              icon={<Zap size={18} />}
              title="Quick scenarios"
              body="One-click presets — Bullish ATM Call, Bearish Hedge, Volatility Crush — to load complete setups instantly."
            />
            <Feature
              icon={<Lock size={18} />}
              title="Save & revisit"
              body="Sign in with Google to persist analyses to your private Firestore vault and revisit them anytime."
            />
            <Feature
              icon={<ShieldCheck size={18} />}
              title="Indian-market defaults"
              body="Pre-tuned with RBI risk-free rate, NSE lot sizes, and NSE-listed tickers including NIFTY and BANKNIFTY."
            />
          </div>
        </section>

        {/* Flow */}
        <section id="flow" className="py-16">
          <div className="glass relative overflow-hidden p-6 md:p-10">
            <div className="grid gap-10 md:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Pick a ticker",
                  d: "Choose NIFTY, BANKNIFTY, or any NSE F&O stock. Spot loads from a synthetic walk in demo mode.",
                },
                {
                  n: "02",
                  t: "Ask Gemini for IV",
                  d: "We send a grounded prompt to Gemini 2.5 — including news context — and parse a JSON volatility forecast.",
                },
                {
                  n: "03",
                  t: "Solve & visualize",
                  d: "BSM math runs locally: fair value, Greeks, break-even, payoff curve. Save to Firestore if you want.",
                },
              ].map((s) => (
                <div key={s.n}>
                  <div className="font-mono text-sm text-accent-cyan">{s.n}</div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-slate-50">
                    {s.t}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-400">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto max-w-7xl px-6 pb-10 pt-8 text-xs text-slate-500">
        <div className="flex flex-col items-start justify-between gap-2 border-t border-white/5 pt-6 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} OptiModel AI · Educational tool, not investment advice.</div>
          <div>Built with React · Vite · Tailwind · Firebase · Gemini</div>
        </div>
      </footer>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="label">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold text-slate-50">
        {value}
      </div>
      {trend && (
        <div className="mt-0.5 text-xs text-slate-400">{trend}</div>
      )}
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="glass group relative overflow-hidden p-5 transition hover:border-white/20">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-center gap-2 text-accent-cyan">
        {icon}
        <span className="text-sm font-semibold text-slate-100">{title}</span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}
