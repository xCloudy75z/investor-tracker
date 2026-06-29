import { useEffect, useState } from "react";
import "./App.css";
import { load, save } from "./app/runtime";
import { seedEnvelope } from "./lib/seed";
import { accountStanding, portfolioStanding, type View } from "./lib/calc";
import { formatMoney } from "./lib/money";
import type { Envelope } from "./lib/types";

export function App() {
  const [env, setEnv] = useState<Envelope | null>(null);
  const [view, setView] = useState<View>("current");

  useEffect(() => {
    let e = load();
    if (e.accounts.length === 0) { e = seedEnvelope(); save(e); } // seed on first run
    setEnv(e);
  }, []);

  if (!env) return <main className="wrap">Loading…</main>;

  const fx = env.settings.fxRateNow;
  const inputs = env.accounts.map((account) => ({
    account, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view
  }));
  const total = portfolioStanding(inputs);
  const pos = total.standingBase >= 0;

  return (
    <main className="wrap">
      <header className="bar">
        <span>All brokers</span>
        <div className="toggle">
          <button className={view === "current" ? "on" : ""} onClick={() => setView("current")}>Current round</button>
          <button className={view === "all" ? "on" : ""} onClick={() => setView("all")}>All-time</button>
        </div>
      </header>

      <section className="hero">
        <div className="cell"><div className="lab">In</div><div className="big">{formatMoney(total.capitalBase, "AED")}</div></div>
        <div className="cell"><div className="lab">Worth now</div><div className="big">{formatMoney(total.worthBase, "AED")}</div></div>
        <div className="cell"><div className="lab">Standing</div>
          <div className={`big ${pos ? "pos" : "neg"}`}>{formatMoney(total.standingBase, "AED")}</div>
          <div className={`sub ${pos ? "pos" : "neg"}`}>{(total.standingPct * 100).toFixed(1)}%</div>
        </div>
      </section>

      <h2 className="sect">Per broker</h2>
      {env.accounts.map((account) => {
        const r = accountStanding({ account, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view });
        const up = r.standingBase >= 0;
        return (
          <div className="card" key={account.id}>
            <div className="nm">{account.label}</div>
            <div className="vals">
              <div className="w">{formatMoney(r.worthBase, "AED")}</div>
              <div className={`p ${up ? "pos" : "neg"}`}>{formatMoney(r.standingBase, "AED")} · {(r.standingPct * 100).toFixed(1)}%</div>
            </div>
          </div>
        );
      })}
    </main>
  );
}
