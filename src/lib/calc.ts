// src/lib/calc.ts
import type { Account, CashFlow, Holding, PurificationRecord } from "./types";
import { convert } from "./money";

export type View = "current" | "all";

function inView(flow: CashFlow, view: View, acc: Account): boolean {
  if (view === "all") return true;
  return flow.date >= acc.roundStartDate;
}

/** Σ completed deposit AED − Σ completed withdrawal AED (locked base). Processing & fees excluded. */
export function capitalDeployed(flows: CashFlow[], view: View, acc: Account): number {
  return flows
    .filter((f) => f.accountId === acc.id && f.status === "completed" && inView(f, view, acc))
    .reduce((sum, f) => {
      if (f.type === "deposit") return sum + f.amountBase;
      if (f.type === "withdrawal") return sum - f.amountBase;
      return sum;
    }, 0);
}

/** Pending (completed) fees in native minor units. */
export function pendingFeesNative(flows: CashFlow[], acc: Account): number {
  return flows
    .filter((f) => f.accountId === acc.id && f.type === "fee" && f.status === "completed")
    .reduce((sum, f) => sum + f.amountNative, 0);
}

/** Idle cash native = sum of cash-class holdings. */
export function idleCashNative(holdings: Holding[], acc: Account): number {
  return holdings
    .filter((h) => h.accountId === acc.id && h.assetClass === "cash")
    .reduce((sum, h) => sum + h.currentValueNative, 0);
}

/** worth_now_native = non-cash holdings + idle cash − pending fees. */
export function worthNowNative(holdings: Holding[], flows: CashFlow[], acc: Account): number {
  const invested = holdings
    .filter((h) => h.accountId === acc.id && h.assetClass !== "cash")
    .reduce((sum, h) => sum + h.currentValueNative, 0);
  return invested + idleCashNative(holdings, acc) - pendingFeesNative(flows, acc);
}

export interface StandingInput {
  account: Account;
  flows: CashFlow[];
  holdings: Holding[];
  fxRateNow: number;
  view: View;
}

export interface Standing {
  capitalBase: number;
  worthNative: number;
  worthBase: number;
  standingBase: number;
  standingPct: number; // ratio, e.g. -0.0105
  idleCashBase: number;
}

export function accountStanding(input: StandingInput): Standing {
  const { account, flows, holdings, fxRateNow, view } = input;
  const capitalBase = capitalDeployed(flows, view, account);
  const worthNative = worthNowNative(holdings, flows, account);
  const worthBase = convert(worthNative, fxRateNow);
  const standingBase = worthBase - capitalBase;
  const standingPct = capitalBase === 0 ? 0 : standingBase / capitalBase;
  const idleCashBase = convert(idleCashNative(holdings, account), fxRateNow);
  return { capitalBase, worthNative, worthBase, standingBase, standingPct, idleCashBase };
}

export interface Reconciliation {
  myNetNative: number;
  brokerNetNative: number | null;
  gapNative: number;
  reconciled: boolean;
}

/** All-time net native deposits (deposits − withdrawals), compared to broker's reported figure. */
export function reconcile(flows: CashFlow[], acc: Account): Reconciliation {
  const myNetNative = flows
    .filter((f) => f.accountId === acc.id)
    .reduce((sum, f) => {
      if (f.type === "deposit") return sum + f.amountNative;
      if (f.type === "withdrawal") return sum - f.amountNative;
      return sum;
    }, 0);
  const brokerNetNative = acc.brokerNetDepositsNative ?? null;
  const gapNative = brokerNetNative === null ? 0 : myNetNative - brokerNetNative;
  return { myNetNative, brokerNetNative, gapNative, reconciled: brokerNetNative !== null && gapNative === 0 };
}

/** Σ completed fee flows in base, for the view. */
export function feesPaid(flows: CashFlow[], view: View, acc: Account): number {
  return flows
    .filter((f) => f.accountId === acc.id && f.type === "fee" && f.status === "completed" && inView(f, view, acc))
    .reduce((sum, f) => sum + f.amountBase, 0);
}

export interface PurificationSummary {
  owedBase: number;       // total ever owed
  donatedBase: number;    // total marked donated
  outstandingBase: number;// owed and not yet donated
}

export function purificationSummary(recs: PurificationRecord[], accountId: string): PurificationSummary {
  const mine = recs.filter((r) => r.accountId === accountId);
  const owedBase = mine.reduce((s, r) => s + r.owedBase, 0);
  const donatedBase = mine.filter((r) => r.status === "donated").reduce((s, r) => s + r.owedBase, 0);
  const outstandingBase = mine.filter((r) => r.status === "owed").reduce((s, r) => s + r.owedBase, 0);
  return { owedBase, donatedBase, outstandingBase };
}

export interface PortfolioStanding {
  capitalBase: number;
  worthBase: number;
  standingBase: number;
  standingPct: number;
}

export function portfolioStanding(inputs: StandingInput[]): PortfolioStanding {
  const parts = inputs.map(accountStanding);
  const capitalBase = parts.reduce((s, p) => s + p.capitalBase, 0);
  const worthBase = parts.reduce((s, p) => s + p.worthBase, 0);
  const standingBase = worthBase - capitalBase;
  const standingPct = capitalBase === 0 ? 0 : standingBase / capitalBase;
  return { capitalBase, worthBase, standingBase, standingPct };
}
