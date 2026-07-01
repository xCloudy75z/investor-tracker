import type { CSSProperties } from "react";
import { accountStanding, portfolioStanding, type View } from "../lib/calc";
import { formatMoney } from "../lib/money";
import type { Envelope } from "../lib/types";
import { AllocationBar } from "../components/AllocationBar";

interface Props {
  env: Envelope;
  view: View;
  setView: (v: View) => void;
  onOpenBroker: (id: string) => void;
  onOpenData: () => void;
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

export function Home({ env, view, setView, onOpenBroker, onOpenData }: Props) {
  const fx = env.settings.fxRateNow;
  const inputs = env.accounts.map((account) => ({ account, flows: env.cashflows, holdings: env.holdings, fxRateNow: fx, view }));
  const total = portfolioStanding(inputs);
  const pos = total.standingBase >= 0;

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
        <div className={`num hstand ${pos ? "pos" : "neg"}`}><span className="cur">AED</span>{formatMoney(total.standingBase, "").trim()}</div>
        <span className={`pct ${pos ? "pos" : "neg"}`}>{pos ? "▴" : "▾"} {Math.abs(total.standingPct * 100).toFixed(1)}%</span>
        <div className="hsplit">
          <div><div className="l">Put in</div><div className="num v">{formatMoney(total.capitalBase, "AED")}</div></div>
          <div><div className="l">Worth now</div><div className="num v">{formatMoney(total.worthBase, "AED")}</div></div>
        </div>
      </section>

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
              style={{ ["--accent-dot" as string]: ACCENT[account.broker] ?? "var(--muted)" } as CSSProperties}
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

      <button className="datalink rise d6" onClick={onOpenData}>Settings &amp; data</button>
    </main>
  );
}
