import { describe, it, expect } from "vitest";
import { validateEnvelope } from "./validate";
import type { Envelope } from "./types";

function base(): Envelope {
  return {
    schemaVersion: 1,
    settings: { baseCcy: "AED", peg: 3.6725, fxRateNow: 3.68, lastView: "current" },
    accounts: [{ id: "a1", broker: "sarwa", label: "Sarwa", baseCcy: "AED", holdingsCcy: "USD", roundStartDate: "2026-01-01" }],
    cashflows: [], holdings: [], snapshots: [], purification: []
  };
}

describe("validateEnvelope", () => {
  it("accepts a well-formed envelope", () => {
    expect(validateEnvelope(base())).toEqual({ ok: true, errors: [] });
  });

  it("rejects a non-object / missing top-level arrays", () => {
    const r = validateEnvelope({} as unknown);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("flags a cashflow whose accountId has no matching account", () => {
    const env = base();
    env.cashflows.push({ id: "f1", accountId: "ghost", date: "2026-02-01", type: "deposit", amountNative: 100, nativeCcy: "USD", amountBase: 368, baseCcy: "AED", fxRateUsed: 3.68, status: "completed" });
    const r = validateEnvelope(env);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("ghost"))).toBe(true);
  });

  it("flags a holding referencing a missing account", () => {
    const env = base();
    env.holdings.push({ id: "h1", accountId: "ghost", instrument: "X", assetClass: "equity", quantity: 1, currentValueNative: 100, nativeCcy: "USD", halalStatus: "halal", isCopyTrade: false, asOf: "2026-02-01" });
    const r = validateEnvelope(env);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("h1"))).toBe(true);
  });

  it("returns {ok:false} (never throws) on a non-object array row", () => {
    const env = { ...base(), accounts: [null] } as unknown;
    const r = validateEnvelope(env);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("accounts"))).toBe(true);
  });

  it("returns {ok:false} on a non-object cashflow row instead of crashing", () => {
    const env = { ...base(), cashflows: [42] } as unknown;
    const r = validateEnvelope(env);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes("cashflows"))).toBe(true);
  });

  it("rejects a bare null payload cleanly", () => {
    const r = validateEnvelope(null as unknown);
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(["Envelope is not an object"]);
  });
});
