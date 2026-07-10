import { accountStanding, reconcile, purificationSummary, type View } from "../lib/calc";
import { costReport } from "../lib/costs";
import { formatMoney, convert } from "../lib/money";
import type { Envelope, Account } from "../lib/types";
import { AllocationBar } from "../components/AllocationBar";

interface Props {
  env: Envelope;
  account: Account;
  view: View;
  setView: (v: View) => void;
  onBack: () => void;
}

export function Broker({ env, account, view, setView, onBack }: Props) {
  const fx = env.settings.fxRateNow;
  const flows = env.cashflows.filter((f) => f.accountId === account.id);
  const holdings = env.holdings.filter((h) => h.accountId === account.id);
  const r = accountStanding({ account, flows, holdings, fxRateNow: fx, view });
  const rec = reconcile(flows, account);
  const cost = costReport(env, { mode: view === "current" ? "round" : "all" }).brokers
    .find((b) => b.accountId === account.id);
  const pur = purificationSummary(env.purification, account.id);
  const pos = r.standingBase >= 0;

  const deposits = flows
    .filter((f) => f.type === "deposit")
    .filter((f) => view === "all" || f.date >= account.roundStartDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const nonCash = holdings.filter((h) => h.assetClass !== "cash");
  const cash = holdings.filter((h) => h.assetClass === "cash");

  return (
    <main className="wrap">
      <header className="appbar rise d1">
        <button className="back" onClick={onBack}>‹ {account.label}</button>
        <div className="toggle">
          <button className={view === "current" ? "on" : ""} onClick={() => setView("current")}>Current</button>
          <button className={view === "all" ? "on" : ""} onClick={() => setView("all")}>All-time</button>
        </div>
      </header>

      <section className="hero rise d2">
        <div className="hcap">Standing · {view === "current" ? "current round" : "all-time"}</div>
        <div className={`num hstand ${pos ? "pos" : "neg"}`}>{formatMoney(r.standingBase, "AED")}</div>
        <span className={`pct ${pos ? "pos" : "neg"}`}>{pos ? "▴" : "▾"} {Math.abs(r.standingPct * 100).toFixed(1)}%</span>
        <div className="hsplit">
          <div><div className="l">Put in</div><div className="num v">{formatMoney(r.capitalBase, "AED")}</div></div>
          <div><div className="l">Worth now</div><div className="num v">{formatMoney(r.worthBase, "AED")}</div></div>
        </div>
      </section>

      <div className={`recon ${rec.reconciled ? "ok" : "warn"} rise d3`}>
        {rec.brokerNetNative === null
          ? "No broker net-deposits figure to reconcile."
          : rec.reconciled
            ? "✓ Reconciled to the broker figure."
            : `Reconciliation gap: ${formatMoney(rec.gapNative, "USD")}`}
        {typeof account.brokerTwrPct === "number" && (
          <span className="muted"> · broker TWR {account.brokerTwrPct}% (ignore)</span>
        )}
      </div>

      <h2 className="sect">Deposits · {view === "current" ? "this round" : "all-time"}</h2>
      {deposits.length === 0 ? <p className="muted small">None.</p> : deposits.map((d) => (
        <div className="row" key={d.id}>
          <div>{d.date}{d.status === "processing" ? " · processing" : ""}</div>
          <div className="r num">{formatMoney(d.amountBase, "AED")} <span className="muted">· {formatMoney(d.amountNative, "USD")} @{d.fxRateUsed}</span></div>
        </div>
      ))}

      <h2 className="sect">Holdings · allocation</h2>
      <AllocationBar holdings={[...nonCash, ...cash]} />
      {nonCash.map((h) => (
        <div className="row" key={h.id}>
          <div className="hn">{h.instrument}{h.isCopyTrade ? " (copy)" : ""} <span className={`chip-${h.halalStatus}`}>{h.halalStatus.replace("_", " ")}</span></div>
          <div className="r num">{formatMoney(h.currentValueNative, "USD")}
            {typeof h.unrealizedPlNative === "number" && (
              <span className={h.unrealizedPlNative >= 0 ? "pos" : "neg"}> {h.unrealizedPlNative >= 0 ? "+" : ""}{formatMoney(h.unrealizedPlNative, "USD")}</span>
            )}
          </div>
        </div>
      ))}
      {cash.map((c) => (
        <div className="idle" key={c.id}>● Idle cash {formatMoney(convert(c.currentValueNative, fx), "AED")} ({formatMoney(c.currentValueNative, "USD")}) — uninvested</div>
      ))}

      <h2 className="sect">Fees &amp; FX cost · {view === "current" ? "this round" : "all-time"}</h2>
      <div className="box">
        <div className="spread">
          <div><div className="num big2 neg">{formatMoney(cost?.subtotalBase ?? 0, "AED")}</div><span className="muted small">what it has cost you</span></div>
        </div>
        <div className="row noborder"><div className="muted">Fees paid</div><div className="r num">{formatMoney(cost?.feesBase ?? 0, "AED")}</div></div>
        <div className="row noborder"><div className="muted">FX spread <span className="muted small">· bank rate vs peg</span></div><div className="r num">{formatMoney(cost?.fxDragBase ?? 0, "AED")}</div></div>
      </div>

      <h2 className="sect">Purification <span className="chip-warn">screened, not certified</span></h2>
      <div className="box">
        <div className="spread">
          <div><div className="num big2 gold">{formatMoney(pur.outstandingBase, "AED")}</div><span className="muted small">outstanding · to give away</span></div>
        </div>
        <div className="row noborder"><div className="muted">Total ever owed</div><div className="r num">{formatMoney(pur.owedBase, "AED")}</div></div>
        <div className="row noborder"><div className="muted">Donated to date</div><div className="r num">{formatMoney(pur.donatedBase, "AED")}</div></div>
      </div>
    </main>
  );
}
