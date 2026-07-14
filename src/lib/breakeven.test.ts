import { describe, it, expect } from "vitest";
import { breakeven, LANE_PRESETS, type Lane } from "./breakeven";

const lane = (over: Partial<Lane>): Lane => ({
  id: "t", label: "t", hint: "", fxInPct: 0, fxOutPct: 0, flatFeeMinor: 0, ...over,
});

describe("breakeven", () => {
  it("with zero costs, net == gross and break-even == 0", () => {
    const r = breakeven(500000, 20, lane({}));
    expect(r.receivedMinor).toBe(600000);
    expect(r.netProfitMinor).toBe(100000);
    expect(r.netProfitPct).toBeCloseTo(20, 6);
    expect(r.breakEvenPct).toBeCloseTo(0, 6);
    expect(r.totalCostMinor).toBe(0);
  });

  it("cheap lane (~0.3% each way) on +20% nets ~19.3% and breaks even ~0.6%", () => {
    const cheap = LANE_PRESETS.find((l) => l.id === "cheap")!;
    const r = breakeven(500000, 20, cheap);
    expect(r.netProfitPct).toBeCloseTo(19.28, 1);
    expect(r.breakEvenPct).toBeCloseTo(0.6, 1);
  });

  it("eToro lane (~1.5% each way + $5) on +20% nets ~16% and breaks even ~3.5%", () => {
    const etoro = LANE_PRESETS.find((l) => l.id === "etoro")!;
    const r = breakeven(500000, 20, etoro);
    expect(r.netProfitPct).toBeCloseTo(16.06, 1);
    expect(r.breakEvenPct).toBeCloseTo(3.45, 1);
    expect(r.totalCostMinor).toBeGreaterThan(0);
  });

  it("the FX spread is paid twice — costs exceed a single one-way spread", () => {
    // 2% each way on 5000 with no gain: more than 2% (100 AED) lost, because it hits both directions.
    const r = breakeven(500000, 0, lane({ fxInPct: 2, fxOutPct: 2 }));
    expect(r.totalCostMinor).toBeGreaterThan(10000); // > 100.00 AED
    expect(r.netProfitMinor).toBeLessThan(0);
  });

  it("break-even is self-consistent: gaining exactly break-even% nets ~zero", () => {
    const etoro = LANE_PRESETS.find((l) => l.id === "etoro")!;
    const be = breakeven(500000, 0, etoro).breakEvenPct;
    const r = breakeven(500000, be, etoro);
    expect(Math.abs(r.netProfitMinor)).toBeLessThanOrEqual(50); // within 0.50 AED of zero (rounding)
  });

  it("a flat fee alone pushes break-even above zero even with no FX spread", () => {
    const r = breakeven(500000, 0, lane({ flatFeeMinor: 1836 })); // $5 @ peg
    expect(r.breakEvenPct).toBeGreaterThan(0);
    expect(r.netProfitMinor).toBe(-1836);
  });

  it("guards a zero / empty deposit without dividing by zero", () => {
    const r = breakeven(0, 20, LANE_PRESETS[0]);
    expect(r.netProfitMinor).toBe(0);
    expect(r.netProfitPct).toBe(0);
    expect(r.breakEvenPct).toBe(0);
    expect(Number.isFinite(r.breakEvenPct)).toBe(true);
  });

  it("negative gain compounds with costs into a deeper loss", () => {
    const cheap = LANE_PRESETS.find((l) => l.id === "cheap")!;
    const r = breakeven(500000, -10, cheap);
    expect(r.netProfitPct).toBeLessThan(-10);
  });
});
