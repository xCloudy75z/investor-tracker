import { useState } from "react";
import { costReport, type DateRange } from "../lib/costs";
import { formatMoney } from "../lib/money";
import { now } from "../app/runtime";
import type { Envelope } from "../lib/types";

const LABEL: Record<string, string> = { sarwa: "Sarwa", baraka: "Baraka", etoro: "eToro" };
const DOT: Record<string, string> = { sarwa: "var(--sarwa)", baraka: "var(--baraka)", etoro: "var(--etoro)" };

export function Costs({ env }: { env: Envelope }) {
  const today = now().slice(0, 10);
  const earliest = env.cashflows.reduce((m, f) => (f.date < m ? f.date : m), today);
  const [mode, setMode] = useState<DateRange["mode"]>("all");
  const [from, setFrom] = useState(earliest);
  const [to, setTo] = useState(today);

  const range: DateRange = mode === "custom" ? { mode: "custom", from, to } : { mode };
  const report = costReport(env, range);

  const money0 = (m: number) => formatMoney(m, "AED").replace(" AED", "");
  const usd = (m: number) => "$" + formatMoney(m, "").trim();

  return (
    <main className="wrap">
      <h1 className="h1 rise d1">Fees &amp; FX cost</h1>

      <div className="toggle rangesel rise d1">
        <button className={mode === "round" ? "on" : ""} onClick={() => setMode("round")}>This round</button>
        <button className={mode === "all" ? "on" : ""} onClick={() => setMode("all")}>All time</button>
        <button className={mode === "custom" ? "on" : ""} onClick={() => setMode("custom")}>Custom</button>
      </div>
      {mode === "custom" ? (
        <div className="customrange rise d1">
          <input type="date" className="linkinput" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          <span className="muted">→</span>
          <input type="date" className="linkinput" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
      ) : (
        <p className="range muted small">{mode === "round" ? "Each broker’s current round → today" : "All activity"}</p>
      )}

      <section className="hero rise d2">
        <div className="hcap">What it has cost you</div>
        <div className="num hstand neg">{formatMoney(report.totalBase, "AED")}</div>
        <div className="hsplit">
          <div><div className="l">Fees paid</div><div className="num v">{formatMoney(report.feesBase, "AED")}</div></div>
          <div><div className="l">FX spread</div><div className="num v">{formatMoney(report.fxDragBase, "AED")}</div></div>
        </div>
      </section>

      {report.brokers.map((b) => {
        const empty = b.deposits.length === 0 && b.withdrawals.length === 0 && b.accountFees.length === 0;
        return (
          <div key={b.accountId}>
            <div className="sect costsect">
              <span style={{ color: DOT[b.broker] ?? "var(--mut)" }}>{LABEL[b.broker] ?? b.label}</span>
              <span className="num csub">{formatMoney(b.subtotalBase, "AED")}</span>
            </div>
            <div className="box">
              {empty ? (
                <div className="cempty">No activity in this range.</div>
              ) : (
                <>
                  {b.deposits.length > 0 && <div className="grp">Deposits</div>}
                  {b.deposits.map((r) => (
                    <div className="crow" key={r.id}>
                      <div>
                        <div className="num camt">{formatMoney(r.amountBase, "AED")}</div>
                        <div className="cmeta">{r.date} · {usd(r.amountNative ?? 0)} @ {r.fxRateUsed}</div>
                      </div>
                      <div className="cright">
                        <div className="num cfx">−{money0(r.fxCostBase)}</div>
                        <div className="clab">FX cost</div>
                      </div>
                    </div>
                  ))}

                  {b.withdrawals.length > 0 && <div className={`grp ${b.deposits.length ? "tb" : ""}`}>Withdrawals</div>}
                  {b.withdrawals.map((r) => (
                    <div className="crow" key={r.id}>
                      <div>
                        <div className="num camt">{formatMoney(r.amountBase, "AED")}</div>
                        <div className="cmeta">{r.date} · {usd(r.amountNative ?? 0)} @ {r.fxRateUsed}</div>
                      </div>
                      <div className="cright">
                        <div className="num cfx">−{money0(r.fxCostBase)} <span className="ctag">FX</span></div>
                        {r.feeBase ? <div className="num cfee">−{money0(r.feeBase)} <span className="ctag">fee</span></div> : null}
                      </div>
                    </div>
                  ))}

                  {b.accountFees.length > 0 && <div className={`grp ${b.deposits.length || b.withdrawals.length ? "tb" : ""}`}>Account fees</div>}
                  {b.accountFees.map((r) => (
                    <div className="crow" key={r.id}>
                      <div>
                        <div className="num camt">{r.label ?? "Fee"}</div>
                        <div className="cmeta">{r.date}</div>
                      </div>
                      <div className="cright">
                        <div className="num cfee">−{money0(r.feeBase ?? 0)}</div>
                        <div className="clab">fee</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        );
      })}

      <p className="muted small" style={{ margin: "16px 4px 0" }}>
        “FX spread” is the AED you lost to your bank’s exchange rate versus the market peg (3.6725) — on every deposit and withdrawal.
      </p>
    </main>
  );
}
