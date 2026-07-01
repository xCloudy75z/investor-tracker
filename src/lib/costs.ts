// src/lib/costs.ts — pure: fees paid + FX drag (bank FX rate vs the fxRateNow peg), in AED minor units.
import type { Envelope, Account } from "./types";
import { convert } from "./money";

export interface AccountCost {
  accountId: string;
  feesBase: number;    // Σ completed fee cashflows (AED)
  fxDragBase: number;  // AED lost to bank FX markup vs peg (deposit overpay + withdrawal shortfall)
  totalBase: number;
}

export function accountCost(env: Envelope, acc: Account): AccountCost {
  const fx = env.settings.fxRateNow;
  const flows = env.cashflows.filter((f) => f.accountId === acc.id && f.status === "completed");
  const feesBase = flows.filter((f) => f.type === "fee").reduce((s, f) => s + f.amountBase, 0);
  let fxDragBase = 0;
  for (const f of flows) {
    if (f.type === "deposit") fxDragBase += f.amountBase - convert(f.amountNative, fx);
    else if (f.type === "withdrawal") fxDragBase += convert(f.amountNative, fx) - f.amountBase;
  }
  return { accountId: acc.id, feesBase, fxDragBase, totalBase: feesBase + fxDragBase };
}

export function costByAccount(env: Envelope): AccountCost[] {
  return env.accounts.map((a) => accountCost(env, a));
}

export interface CostTotal { feesBase: number; fxDragBase: number; totalBase: number; }

export function costTotal(env: Envelope): CostTotal {
  const parts = costByAccount(env);
  return {
    feesBase: parts.reduce((s, p) => s + p.feesBase, 0),
    fxDragBase: parts.reduce((s, p) => s + p.fxDragBase, 0),
    totalBase: parts.reduce((s, p) => s + p.totalBase, 0)
  };
}
