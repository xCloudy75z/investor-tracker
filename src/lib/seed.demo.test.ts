import { describe, it, expect } from "vitest";
import { seedEnvelope } from "./seed";
import { accountStanding, reconcile, feesPaid } from "./calc";

// Smoke/golden test for the public demo build. Exercises the engine end-to-end
// with demo numbers (no personal data).
describe("seed — demo portfolio", () => {
  const env = seedEnvelope();
  const acc = env.accounts[0];
  const fx = env.settings.fxRateNow; // 3.68

  it("computes the demo current-round standing", () => {
    const r = accountStanding({ account: acc, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view: "current" });
    expect(r.capitalBase).toBe(1104000);     // AED 11,040.00 (368000 + 736000)
    expect(r.worthNative).toBe(274500);      // 270000 holdings + 5000 cash - 500 fee
    expect(r.worthBase).toBe(1010160);       // round(274500 * 3.68)
    expect(r.standingBase).toBe(-93840);     // 1010160 - 1104000
    expect(Math.round(r.standingPct * 10000) / 10000).toBe(-0.085);
    expect(r.idleCashBase).toBe(18400);      // round(5000 * 3.68)
  });

  it("reconciles demo net deposits", () => {
    const rec = reconcile(env.cashflows, acc);
    expect(rec.myNetNative).toBe(290000);    // 100000 + 200000 - 10000
    expect(rec.brokerNetNative).toBe(290000);
    expect(rec.reconciled).toBe(true);
  });

  it("surfaces demo fees in the current round", () => {
    expect(feesPaid(env.cashflows, "current", acc)).toBe(1840); // AED 18.40
  });
});
