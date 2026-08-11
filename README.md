# OptiModel AI — Hybrid BSM Options Dashboard

A professional Black-Scholes-Merton options dashboard for the Indian market (NSE),
where the volatility input is replaced by a Gemini-predicted implied volatility
forecast grounded in real-time market context.

## Stack

- React 18 + TypeScript + Vite (port `3000`)
- Tailwind CSS (dark / glassmorphism theme)
- Firebase Auth (Google) + Firestore for saved analyses
- `@google/genai` (Gemini 2.5 Flash) with Google Search grounding
- Recharts for price + payoff charts, Framer Motion for transitions
- Lucide React for iconography

## Getting started

```bash
npm install
npm run dev   # http://localhost:3000
```

The app boots into a fully functional **demo mode** with no keys required —
synthetic price history, deterministic baseline volatility, and an unauthenticated
"Explore without signing in" path.

### Enable live AI forecasts

Create `.env` from `.env.example`:

```bash
VITE_API_KEY=your-gemini-api-key
```

The Gemini service queries `gemini-2.5-flash` with a `googleSearch` grounding tool
and parses a JSON `{ volatility, insight }` payload, plus citation links.

### Enable Google sign-in + saved analyses

Either set the `VITE_FIREBASE_*` env vars, or drop a `src/firebase-config.json`:

```json
{
  "apiKey": "…",
  "authDomain": "…",
  "projectId": "…",
  "storageBucket": "…",
  "messagingSenderId": "…",
  "appId": "…"
}
```

Firestore data model:

- `/users/{uid}` — profile mirror (`email`, `displayName`, `photoURL`, `lastSeenAt`)
- `/users/{uid}/savedAnalyses/{id}` — `{ inputs, result, insight, createdAt }`

## Project layout

```
src/
  services/
    bsm.ts          # Pure math: BSM closed-form, Greeks, payoff curve
    firebase.ts     # Auth + Firestore (config-aware, demo-safe)
    gemini.ts       # Volatility predictor with Google Search grounding
  context/AuthContext.tsx
  data/             # Tickers + synthetic price history
  components/       # UI primitives (TickerSelector, GreeksGrid, charts, …)
  pages/
    Landing.tsx     # SaaS-style hero + feature sections
    Dashboard.tsx   # Main modeling workspace
  styles/index.css  # Tailwind + theme tokens
```

## Notes

- BSM uses the Abramowitz & Stegun 26.2.17 approximation for the cumulative normal,
  with edge-case handling for `T → 0` and `σ → 0`.
- Theta is reported per calendar day; Vega per 1% IV; Rho per 1% rate.
- Risk-free rate defaults to 7% as an RBI repo proxy; tweak in the right rail.
- Educational tool — not investment advice.
