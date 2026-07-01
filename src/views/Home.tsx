import type { CSSProperties } from "react";
import { accountStanding, portfolioStanding, type View } from "../lib/calc";
import { formatMoney } from "../lib/money";
import type { Envelope } from "../lib/types";
import { AllocationBar } from "../components/AllocationBar";
import { getHistory } from "../app/runtime";
import { chartGeometry } from "../lib/chart";

interface Props {
  env: Envelope;
  view: View;
  setView: (v: View) => void;
  onOpenBroker: (id: string) => void;
  onOpenData: () => void;
  onOpenCosts: () => void;
}

const ACCENT: Record<string, string> = { sarwa: "var(--sarwa)", baraka: "var(--baraka)", etoro: "var(--etoro)" };
const TAG: Record<string, string> = { sarwa: "Halal robo · ETFs + sukuk", baraka: "US stocks & ETFs", etoro: "Stocks + copy-trading" };

function Logo() {
  return (
    <span className="mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 15l5-5 4 3 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="5" r="1.6" fill="#fff" />
      </svg>
    </span>
  );
}

export function Home({ env, view, setView, onOpenBroker, onOpenData, onOpenCosts }: Props) {
  const fx = env.settings.fxRateNow;
  const inputs = env.accounts.map((account) => ({ account, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view }));
  const total = portfolioStanding(inputs);
  const pos = total.standingBase >= 0;
  const history = getHistory();
  const geo = chartGeometry(history, 300, 90, 8);

  return (
    <main className="wrap">
      <header className="appbar rise d1">
        <div className="brand"><Logo /><b>Portfolio</b></div>
        <div className="toggle">
          <button className={view === "current" ? "on" : ""} onClick={() => setView("current")}>Current</button>
          <button className={view === "all" ? "on" : ""} onClick={() => setView("all")}>All-time</button>
        </div>
      </header>

      <section className="hero rise d2">
        <div className="hcap">Standing · {view === "current" ? "current round" : "all-time"}</div>
        <div className={`num hstand ${pos ? "pos" : "neg"}`}>{formatMoney(total.standingBase, "AED")}</div>
        <span className={`pct ${pos ? "pos" : "neg"}`}>{pos ? "▴" : "▾"} {Math.abs(total.standingPct * 100).toFixed(1)}%</span>
        <div className="hsplit">
          <div><div className="l">Put in</div><div className="num v">{formatMoney(total.capitalBase, "AED")}</div></div>
          <div><div className="l">Worth now</div><div className="num v">{formatMoney(total.worthBase, "AED")}</div></div>
        </div>
      </section>

      {history.length >= 2 ? (
        <div className="card chartcard rise d3">
          <div className="hcap">Worth over time</div>
          <svg viewBox="0 0 300 90" className="chart" preserveAspectRatio="none" aria-label="worth over time">
            <path d={geo.area} fill="var(--grnbg)" />
            <path d={geo.line} fill="none" stroke="var(--grn)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="chartx"><span>{history[0].date}</span><span>{history[history.length - 1].date}</span></div>
        </div>
      ) : (
        <div className="card chartcard rise d3">
          <div className="hcap">Worth over time</div>
          <p className="muted small" style={{ marginTop: 8 }}>Building your history — open or sync the app over a few days and the trend line appears here.</p>
        </div>
      )}

      <div className="slab rise d3"><span>Per broker</span><em>tap for detail</em></div>
      <div className="cards">
        {env.accounts.map((account, i) => {
          const r = accountStanding({ account, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view });
          const up = r.standingBase >= 0;
          const hs = env.holdings.filter((h) => h.accountId === account.id);
          const delay = `d${Math.min(i + 4, 6)}`;
          return (
            <button
              className={`bcard rise ${delay}`}
              key={account.id}
              onClick={() => onOpenBroker(account.id)}
              style={{ ["--accent" as string]: ACCENT[account.broker] ?? "var(--mut)" } as CSSProperties}
            >
              <span className="accent" />
              <div className="brow1">
                <div className="bnm"><span className="bdot" />{account.label}</div>
                <div className="num bworth">{formatMoney(r.worthBase, "AED")}</div>
              </div>
              <div className="brow2">
                <span className="btag">{TAG[account.broker] ?? account.broker}</span>
                <span className={`chip ${up ? "pos" : "neg"}`}>{up ? "+" : "−"}{Math.abs(r.standingPct * 100).toFixed(1)}%</span>
              </div>
              <AllocationBar holdings={hs} />
            </button>
          );
        })}
      </div>

      <button className="datalink" onClick={onOpenCosts}>Fees &amp; FX cost</button>

      <button className="datalink rise d6" onClick={onOpenData}>Settings &amp; data</button>
    </main>
  );
}
