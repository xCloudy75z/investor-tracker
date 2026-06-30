// src/lib/types.ts
export type Broker = "sarwa" | "baraka" | "etoro";
export type Ccy = "AED" | "USD";
export type AssetClass = "equity" | "sukuk" | "commodity" | "cash" | "copy";
export type HalalStatus = "halal" | "under_review" | "unsure";
export type CashFlowType = "deposit" | "withdrawal" | "fee";
export type FeeKind = "management" | "withdrawal" | "fx" | "other";
export type FlowStatus = "completed" | "processing";

export interface Account {
  id: string;
  broker: Broker;
  label: string;
  accountRef?: string;
  baseCcy: Ccy;        // "AED"
  holdingsCcy: Ccy;    // "USD"
  roundStartDate: string;        // ISO date; current round = flows on/after this
  brokerNetDepositsNative?: number; // minor units, for reconciliation
  brokerTwrPct?: number;            // shown muted, never headline
  notes?: string;
}

export interface CashFlow {
  id: string;
  accountId: string;
  date: string;                  // ISO date
  type: CashFlowType;
  amountNative: number;          // minor units (USD)
  nativeCcy: Ccy;
  amountBase: number;            // minor units (AED), LOCKED at txn time
  baseCcy: Ccy;
  fxRateUsed: number;
  feeKind?: FeeKind;
  /** Fees only: true = accrued but NOT yet deducted from the reported holdings/cash,
   *  so it reduces current worth. Omitted/false = already settled/deducted (shown in
   *  fees-paid totals but NOT subtracted from worth again). */
  accrued?: boolean;
  status: FlowStatus;
  sourceRef?: string;
  memo?: string;
}

export interface Holding {
  id: string;
  accountId: string;
  instrument: string;
  symbol?: string;
  assetClass: AssetClass;
  quantity: number;              // fractional allowed
  currentValueNative: number;    // minor units (USD)
  nativeCcy: Ccy;
  unrealizedPlNative?: number;   // minor units; broker-style secondary
  halalStatus: HalalStatus;
  isCopyTrade: boolean;
  asOf: string;                  // ISO date
}

export interface Snapshot {
  id: string;
  accountId: string;
  asOf: string;
  holdingsValueNative: number;
  idleCashNative: number;
  pendingFeesNative: number;
  totalValueNative: number;
  fxRateToBase: number;
}

export interface PurificationRecord {
  id: string;
  accountId: string;
  instrument?: string;
  period: string;
  incomeNative: number;
  purifyRatioPct: number;
  owedNative: number;
  owedBase: number;
  status: "owed" | "donated";
  donatedDate?: string;
  note?: string;
}

export interface Settings {
  baseCcy: Ccy;        // default "AED"
  peg: number;         // default 3.6725
  fxRateNow: number;   // rate used to value current holdings
  lastView: "current" | "all";
}

export interface Envelope {
  schemaVersion: number;
  settings: Settings;
  accounts: Account[];
  cashflows: CashFlow[];
  holdings: Holding[];
  snapshots: Snapshot[];
  purification: PurificationRecord[];
}
