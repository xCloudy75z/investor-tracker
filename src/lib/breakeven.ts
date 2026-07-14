// src/lib/breakeven.ts — pure: "what would I actually net?" round-trip cost math.
// Everything monetary is in integer AED minor units (fils). Percentages are plain numbers.
//
// A round trip pays the FX spread TWICE — once converting AED→USD on the way in, once
// converting USD→AED on the way out — plus any flat withdrawal fee. So a +20% gross gain
// is never +20% in hand, and break-even is above 0%.

import { convert } from "./money";

const PEG = 3.6725; // AED per USD (used only to express eToro's $5 flat fee in AED)

export interface Lane {
  id: string;
  label: string;
  hint: string;
  fxInPct: number;      // FX spread paid on deposit, %
  fxOutPct: number;     // FX spread paid on withdrawal, %
  flatFeeMinor: number; // flat withdrawal fee, AED minor units
  estimate?: boolean;   // true when the rates are ballpark, not measured
}

export interface BreakevenResult {
  investedMinor: number;
  grossGainPct: number;
  afterDepositMinor: number; // worth after deposit FX, before any gain
  grownMinor: number;        // after the gain, before withdrawal costs
  receivedMinor: number;     // AED actually in hand after withdrawal FX + flat fee
  netProfitMinor: number;    // received − invested
  netProfitPct: number;      // net profit as % of what was put in
  breakEvenPct: number;      // gross gain needed for net profit to reach zero
  idealMinor: number;        // invested × (1+gain), i.e. the gain with zero costs
  totalCostMinor: number;    // ideal − received: AED lost to FX + fees at this scenario
}

/** The three funding lanes we've established for the owner, plus custom is built in the UI. */
export const LANE_PRESETS: Lane[] = [
  { id: "cheap", label: "Cheap bank transfer", hint: "Sarwa ADIB / Baraka Standard", fxInPct: 0.3, fxOutPct: 0.3, flatFeeMinor: 0 },
  { id: "apple", label: "Baraka Apple Pay", hint: "instant funding · hidden FX", fxInPct: 2.2, fxOutPct: 0.3, flatFeeMinor: 0 },
  { id: "etoro", label: "eToro / card", hint: "est. FX + $5 withdrawal", fxInPct: 1.5, fxOutPct: 1.5, flatFeeMinor: convert(500, PEG), estimate: true },
];

export function breakeven(investedMinor: number, grossGainPct: number, lane: Lane): BreakevenResult {
  const invested = Math.max(0, Math.round(investedMinor));
  const g = grossGainPct / 100;
  const inKeep = 1 - lane.fxInPct / 100;
  const outKeep = 1 - lane.fxOutPct / 100;
  const fee = Math.max(0, lane.flatFeeMinor);

  const afterDepositMinor = Math.round(invested * inKeep);
  const grownMinor = Math.round(afterDepositMinor * (1 + g));
  const receivedMinor = Math.round(grownMinor * outKeep) - fee;

  const netProfitMinor = receivedMinor - invested;
  const netProfitPct = invested > 0 ? (netProfitMinor / invested) * 100 : 0;

  // Solve received = invested for the gross gain g:
  //   invested + fee = invested · inKeep · outKeep · (1 + g)
  const denom = invested * inKeep * outKeep;
  const breakEvenPct = denom > 0 ? ((invested + fee) / denom - 1) * 100 : 0;

  const idealMinor = Math.round(invested * (1 + g));
  const totalCostMinor = idealMinor - receivedMinor;

  return {
    investedMinor: invested, grossGainPct,
    afterDepositMinor, grownMinor, receivedMinor,
    netProfitMinor, netProfitPct, breakEvenPct, idealMinor, totalCostMinor,
  };
}
