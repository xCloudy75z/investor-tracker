# Investment Tracker

A small, offline-first **personal investment tracker** PWA. It answers, honestly, across your brokers:

> **How much did I put in (AED), what is it worth now, and am I up or down** — plus fees and halal purification.

- **Money-weighted P/L** (current value − capital deployed), not the broker's flattering time-weighted headline.
- **Current round vs all-time** views, so old withdrawn profit can't inflate where you stand now.
- **AED-based**, with native USD shown alongside; FX locked at deposit time.
- **Idle cash, fees, and reconciliation** surfaced as first-class figures.
- **Local-first**: your data lives in your browser, not on a server. No login, no cloud.

> The data shown in this public build is **demo/sample data only**. Real data is loaded privately on your own device and is never published.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # Vitest
npm run build      # production build (PWA)
```

Built with Vite + React + TypeScript. The money/P&L logic lives in pure, tested modules under `src/lib/`.
