import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    // Proxy live market-data requests to Yahoo Finance server-side. Yahoo's
    // chart endpoint does not return CORS headers and rate-limits requests
    // that arrive without a browser User-Agent, so a direct browser fetch
    // fails. Routing through the dev server (same origin) sidesteps CORS, and
    // we attach a User-Agent so Yahoo stops returning 429.
    proxy: {
      "/yf": {
        target: "https://query1.finance.yahoo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/yf/, ""),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          Accept: "application/json",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
