// src/lib/seed.ts — DEMO data for the public build. No real personal figures.
// Real data is loaded privately on-device (import) and never committed here.
import type { Envelope, Account, CashFlow, Holding } from "./types";
import { CURRENT_SCHEMA } from "./store";

export function seedEnvelope(): Envelope {
  const account: Account = {
    id: "demo-1", broker: "sarwa", label: "Sarwa · Demo", accountRef: "DEMO",
    baseCcy: "AED", holdingsCcy: "USD", roundStartDate: "2026-01-01",
    brokerNetDepositsNative: 290000, brokerTwrPct: 12.5,
    notes: "Demo portfolio — sample data only"
  };

  const cashflows: CashFlow[] = [
    { id: "d-w0", accountId: "demo-1", date: "2025-03-01", type: "withdrawal", amountNative: 10000, nativeCcy: "USD", amountBase: 36000, baseCcy: "AED", fxRateUsed: 3.60, status: "completed", memo: "prior withdrawal" },
    { id: "d-1", accountId: "demo-1", date: "2026-02-01", type: "deposit", amountNative: 100000, nativeCcy: "USD", amountBase: 368000, baseCcy: "AED", fxRateUsed: 3.68, status: "completed" },
    { id: "d-2", accountId: "demo-1", date: "2026-03-01", type: "deposit", amountNative: 200000, nativeCcy: "USD", amountBase: 736000, baseCcy: "AED", fxRateUsed: 3.68, status: "completed" },
    { id: "d-fee", accountId: "demo-1", date: "2026-03-15", type: "fee", amountNative: 500, nativeCcy: "USD", amountBase: 1840, baseCcy: "AED", fxRateUsed: 3.68, status: "completed", feeKind: "management", memo: "management accrual" }
  ];

  const holdings: Holding[] = [
    { id: "d-h1", accountId: "demo-1", instrument: "Global Equity ETF", assetClass: "equity", quantity: 1, currentValueNative: 150000, nativeCcy: "USD", halalStatus: "halal", isCopyTrade: false, asOf: "2026-03-31" },
    { id: "d-h2", accountId: "demo-1", instrument: "Sukuk Fund", assetClass: "sukuk", quantity: 1, currentValueNative: 120000, nativeCcy: "USD", halalStatus: "halal", isCopyTrade: false, asOf: "2026-03-31" },
    { id: "d-cash", accountId: "demo-1", instrument: "Cash", assetClass: "cash", quantity: 1, currentValueNative: 5000, nativeCcy: "USD", halalStatus: "halal", isCopyTrade: false, asOf: "2026-03-31" }
  ];

  return {
    schemaVersion: CURRENT_SCHEMA,
    settings: { baseCcy: "AED", peg: 3.6725, fxRateNow: 3.68, lastView: "current" },
    accounts: [account], cashflows, holdings, snapshots: [], purification: []
  };
}
