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

export type RangeMode = "round" | "all" | "custom";
export interface DateRange { mode: RangeMode; from?: string; to?: string; }

export interface CostRow {
  id: string;
  date: string;
  amountBase: number;
  amountNative?: number;
  fxRateUsed?: number;
  fxCostBase: number;       // 0 for pure fee rows
  feeBase?: number;         // withdrawal rows that carry a fee, and account-fee rows
  feeKind?: string;
  kind: "deposit" | "withdrawal" | "fee";
  label?: string;           // account-fee rows, e.g. "Management fee"
}

export interface BrokerCost {
  accountId: string;
  label: string;
  broker: string;
  deposits: CostRow[];
  withdrawals: CostRow[];
  accountFees: CostRow[];
  feesBase: number;
  fxDragBase: number;
  subtotalBase: number;
}

export interface CostReport {
  brokers: BrokerCost[];
  feesBase: number;
  fxDragBase: number;
  totalBase: number;
}

const FEE_LABEL: Record<string, string> = {
  management: "Management fee", withdrawal: "Withdrawal fee", fx: "FX fee", other: "Fee"
};

function _inRange(date: string, roundStart: string, range: DateRange): boolean {
  if (range.mode === "all") return true;
  if (range.mode === "round") return date >= roundStart;
  const okFrom = !range.from || date >= range.from;
  const okTo = !range.to || date <= range.to;
  return okFrom && okTo;
}

export function costReport(env: Envelope, range: DateRange): CostReport {
  const fx = env.settings.fxRateNow;
  const brokers: BrokerCost[] = env.accounts.map((acc) => {
    const flows = env.cashflows.filter(
      (f) => f.accountId === acc.id && f.status === "completed" && _inRange(f.date, acc.roundStartDate, range)
    );
    const deposits: CostRow[] = flows.filter((f) => f.type === "deposit").map((f) => ({
      id: f.id, date: f.date, amountBase: f.amountBase, amountNative: f.amountNative,
      fxRateUsed: f.fxRateUsed, fxCostBase: f.amountBase - convert(f.amountNative, fx), kind: "deposit"
    }));
    const withdrawals: CostRow[] = flows.filter((f) => f.type === "withdrawal").map((f) => ({
      id: f.id, date: f.date, amountBase: f.amountBase, amountNative: f.amountNative,
      fxRateUsed: f.fxRateUsed, fxCostBase: convert(f.amountNative, fx) - f.amountBase, kind: "withdrawal"
    }));
    const feeFlows = flows.filter((f) => f.type === "fee");

    // Attach each withdrawal fee to a same-date withdrawal (first unused match).
    const usedFeeIds = new Set<string>();
    for (const w of withdrawals) {
      const match = feeFlows.find(
        (f) => f.feeKind === "withdrawal" && f.date === w.date && !usedFeeIds.has(f.id)
      );
      if (match) { w.feeBase = match.amountBase; usedFeeIds.add(match.id); }
    }
    const accountFees: CostRow[] = feeFlows.filter((f) => !usedFeeIds.has(f.id)).map((f) => ({
      id: f.id, date: f.date, amountBase: f.amountBase, fxCostBase: 0, feeBase: f.amountBase,
      feeKind: f.feeKind, kind: "fee", label: FEE_LABEL[f.feeKind ?? "other"] ?? "Fee"
    }));

    const fxDragBase =
      deposits.reduce((s, r) => s + r.fxCostBase, 0) +
      withdrawals.reduce((s, r) => s + r.fxCostBase, 0);
    const feesBase =
      withdrawals.reduce((s, r) => s + (r.feeBase ?? 0), 0) +
      accountFees.reduce((s, r) => s + (r.feeBase ?? 0), 0);

    return {
      accountId: acc.id, label: acc.label, broker: acc.broker,
      deposits, withdrawals, accountFees,
      feesBase, fxDragBase, subtotalBase: feesBase + fxDragBase
    };
  });

  return {
    brokers,
    feesBase: brokers.reduce((s, b) => s + b.feesBase, 0),
    fxDragBase: brokers.reduce((s, b) => s + b.fxDragBase, 0),
    totalBase: brokers.reduce((s, b) => s + b.subtotalBase, 0)
  };
}
